"""
Pipeline — telemetry → R001-R010 rule engine → MongoDB → WebSocket broadcast.

Rule mapping:
  R001  Multiple Failed Login Attempts   — same user, 3+ failures in window
  R002  Brute Force Attempt              — same IP,   5+ failures in window
  R003  Successful Admin Login After Failures — admin login after prior failures
  R004  Audit Logging Disabled           — AUDIT_LOG_DISABLED event
  R005  New Local Admin Created          — NEW_ADMIN_CREATED event
  R006  Windows Defender Disabled        — DEFENDER_DISABLED event
  R007  Suspicious PowerShell Execution  — POWERSHELL_EXEC event
  R008  Endpoint Offline                 — checked separately via /api/check-offline
  R009  Repeated Duplicate Events        — same event_type 5+ times in window
  R010  Known Benign Event               — whitelist of low-noise event types
"""
from __future__ import annotations
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from backend.models import TelemetryPayload, DecisionRecord, EventPayload, DevicePayload
from backend import store
from backend.rules_store import get_enabled_rule_ids
from backend.ws_manager import WebSocketManager

logger = logging.getLogger(__name__)

# ── Thresholds ────────────────────────────────────────────────────────────────
R001_USER_THRESHOLD = 3      # failed logins per user in window
R002_IP_THRESHOLD   = 5      # failed logins per IP in window
R009_DUP_THRESHOLD  = 5      # same event type count in window
WINDOW_MINUTES      = 5      # sliding window for all count-based rules

# ── R010 — known benign event types (suppress decision, just store event) ────
R010_BENIGN_TYPES = {
    "DNS_REQUEST",
    "OUTBOUND_IP",   # low-confidence outbound — not worth alerting by default
}

# ── R007 — high-risk PowerShell keywords ─────────────────────────────────────
_PS_HIGH_RISK = {"-enc", "-encodedcommand", "bypass", "downloadstring", "iex", "invoke-expression",
                 "webclient", "downloadfile", "hidden", "-nop", "-windowstyle hidden"}

# ── Rule definitions ──────────────────────────────────────────────────────────
# Each entry: event_type → (rule_id, severity, title, why, impact, action, confidence, tags)

_SIMPLE_RULES: dict[str, dict] = {
    # R004
    "AUDIT_LOG_DISABLED": {
        "rule_id": "R004",
        "severity": "CRITICAL",
        "title": "Audit logging disabled",
        "why": "Disabling audit logs removes visibility into system activity and is often done to hide malicious actions.",
        "impact": "Attacker activity may go undetected. Forensic investigation becomes impossible.",
        "action": "Re-enable audit logging immediately. Investigate who made the change and why.",
        "confidence": 95,
        "tags": ["audit", "tampering", "R004"],
    },
    # R005
    "NEW_ADMIN_CREATED": {
        "rule_id": "R005",
        "severity": "HIGH",
        "title": "New local admin account created",
        "why": "Creating a new admin account may indicate privilege escalation or backdoor installation.",
        "impact": "Attacker could maintain persistent elevated access to the system.",
        "action": "Verify whether the account creation was authorised. If not, remove the account immediately.",
        "confidence": 88,
        "tags": ["privilege-escalation", "persistence", "R005"],
    },
    # R006
    "DEFENDER_DISABLED": {
        "rule_id": "R006",
        "severity": "CRITICAL",
        "title": "Windows Defender disabled",
        "why": "Endpoint protection being disabled exposes the device to malware and direct attacks.",
        "impact": "System is unprotected. Malware can execute without detection.",
        "action": "Re-enable Windows Defender immediately. Scan the system for malware. Investigate the cause.",
        "confidence": 97,
        "tags": ["endpoint-protection", "R006"],
    },
    # R003 base — admin login (will be upgraded to R003 if prior failures exist)
    "ADMIN_LOGIN": {
        "rule_id": "R003",
        "severity": "MEDIUM",
        "title": "Admin login detected",
        "why": "Admin logins grant elevated privileges. Unexpected ones may indicate compromise.",
        "impact": "Admin access can modify systems, exfiltrate data, or disable security controls.",
        "action": "Verify the login was intentional. If unexpected, suspend session and investigate.",
        "confidence": 70,
        "tags": ["authentication", "privilege", "R003"],
    },
    # ACCOUNT_LOCKOUT (mapped to R001 context)
    "ACCOUNT_LOCKOUT": {
        "rule_id": "R001",
        "severity": "HIGH",
        "title": "Account lockout detected",
        "why": "Account lockouts often follow automated brute-force attempts.",
        "impact": "Legitimate user locked out; attacker may be probing credentials.",
        "action": "Unlock only after verifying identity. Investigate the source of failed attempts.",
        "confidence": 88,
        "tags": ["authentication", "lockout", "R001"],
    },
    # SUSPICIOUS_PORT
    "SUSPICIOUS_PORT": {
        "rule_id": "R007",
        "severity": "CRITICAL",
        "title": "Outbound connection on suspicious port",
        "why": "This port is commonly used by reverse shells or C2 frameworks.",
        "impact": "Active C2 channel could mean the endpoint is fully compromised.",
        "action": "Block the connection immediately. Isolate the endpoint and investigate.",
        "confidence": 90,
        "tags": ["network", "c2", "R007"],
    },
    # PROCESS_SUSPICIOUS
    "PROCESS_SUSPICIOUS": {
        "rule_id": "R007",
        "severity": "MEDIUM",
        "title": "Suspicious process detected",
        "why": "LOLBins are commonly used to evade detection and run malicious code.",
        "impact": "May indicate an attacker using built-in tools to avoid antivirus.",
        "action": "Review the process context and parent process. Terminate if unexpected.",
        "confidence": 65,
        "tags": ["execution", "lolbin", "R007"],
    },
    # UNKNOWN_SCRIPT
    "UNKNOWN_SCRIPT": {
        "rule_id": "R007",
        "severity": "MEDIUM",
        "title": "Unknown script execution",
        "why": "Scripts from unknown sources may execute malicious payloads.",
        "impact": "Could lead to data theft, persistence, or further compromise.",
        "action": "Identify the script source. Block execution if origin is unknown.",
        "confidence": 72,
        "tags": ["execution", "script", "R007"],
    },
    # OUTBOUND_IP — kept as fallback if R010 is disabled
    "OUTBOUND_IP": {
        "rule_id": "R010",
        "severity": "LOW",
        "title": "Outbound connection to external IP",
        "why": "Unexpected outbound connections may indicate beaconing or exfiltration.",
        "impact": "Low risk unless destination is known-malicious or traffic volume is high.",
        "action": "Verify the destination is expected. Check for unusual data volumes.",
        "confidence": 55,
        "tags": ["network", "outbound", "R010"],
    },
}


def _build_decision(
    event: EventPayload,
    device: DevicePayload,
    rule: dict,
    override_title: str | None = None,
    override_confidence: int | None = None,
    override_severity: str | None = None,
) -> DecisionRecord:
    title = override_title or rule["title"]
    user = event.raw.get("user", "")
    if user and user not in title:
        title = f"{title} — {user}"
    return DecisionRecord(
        id=str(uuid.uuid4()),
        event_id=event.id,
        event_type=event.event_type,
        severity=override_severity or rule["severity"],
        rule_id=rule["rule_id"],
        title=title,
        what_happened=event.description,
        why_it_matters=rule["why"],
        business_impact=rule["impact"],
        recommended_action=rule["action"],
        confidence=override_confidence or rule["confidence"],
        tags=rule["tags"],
        device=device,
        created_at=datetime.utcnow(),
    )


async def process_telemetry(
    payload: TelemetryPayload,
    ws: WebSocketManager,
) -> list[DecisionRecord]:
    """
    Main pipeline entry point.
    1. Store all events
    2. Check which rules are enabled
    3. Apply count-based context (R001, R002, R009)
    4. Apply simple event-type rules (R003-R007, R010)
    5. Save decisions + broadcast via WebSocket
    """
    decisions: list[DecisionRecord] = []
    enabled_rules = await get_enabled_rule_ids()

    # ── Count-based context for this batch ────────────────────────────────────
    # Track failures by user and by IP within this telemetry batch
    # (for cross-batch analysis we query MongoDB below)
    failed_by_user: dict[str, int] = defaultdict(int)
    failed_by_ip:   dict[str, int] = defaultdict(int)
    event_type_counts: dict[str, int] = defaultdict(int)

    # First pass: store events and build counters
    for event in payload.events:
        ev = EventPayload(**{**event.model_dump(), "device": payload.device.model_dump()})
        await store.add_event(ev, payload.device)

        if event.event_type == "FAILED_LOGIN":
            user = event.raw.get("user", "unknown")
            ip   = event.raw.get("source_ip", "unknown")
            failed_by_user[user] += 1
            failed_by_ip[ip]     += 1

        event_type_counts[event.event_type] += 1

    # Also query recent events from DB (last WINDOW_MINUTES) for cross-batch counts
    recent_cutoff = (datetime.utcnow() - timedelta(minutes=WINDOW_MINUTES)).isoformat()
    recent_failures = await store.get_recent_failed_logins(since_iso=recent_cutoff)
    for rec in recent_failures:
        user = rec.get("raw", {}).get("user", "unknown")
        ip   = rec.get("raw", {}).get("source_ip", "unknown")
        failed_by_user[user] += 1
        failed_by_ip[ip]     += 1

    # Track which rule+key combos already fired this batch (avoid duplicate alerts)
    fired: set[str] = set()

    # ── Second pass: apply rules ───────────────────────────────────────────────
    for event in payload.events:
        ev = EventPayload(**{**event.model_dump(), "device": payload.device.model_dump()})
        decision: DecisionRecord | None = None
        et = event.event_type

        # ── R010 — Known benign (suppress if enabled) ─────────────────────────
        if et in R010_BENIGN_TYPES and "R010" in enabled_rules:
            logger.debug("R010 suppressed benign event: %s", et)
            continue

        # ── R009 — Repeated duplicate events ─────────────────────────────────
        if "R009" in enabled_rules:
            if event_type_counts[et] >= R009_DUP_THRESHOLD:
                key = f"R009-{et}"
                if key not in fired:
                    fired.add(key)
                    decision = DecisionRecord(
                        id=str(uuid.uuid4()),
                        event_id=event.id,
                        event_type=et,
                        severity="MEDIUM",
                        rule_id="R009",
                        title=f"Repeated duplicate events — {et} ({event_type_counts[et]}x)",
                        what_happened=f"The event type '{et}' fired {event_type_counts[et]} times within {WINDOW_MINUTES} minutes.",
                        why_it_matters="High-frequency duplicate events may indicate a misconfiguration, loop, or noisy attack tool.",
                        business_impact="Alert fatigue can cause operators to miss real threats.",
                        recommended_action="Investigate the source. If legitimate, consider tuning the detection threshold.",
                        confidence=75,
                        tags=["noise", "duplicate", "R009"],
                        device=payload.device,
                        created_at=datetime.utcnow(),
                    )

        # ── R002 — Brute force (same IP) ──────────────────────────────────────
        if decision is None and et == "FAILED_LOGIN" and "R002" in enabled_rules:
            ip = event.raw.get("source_ip", "unknown")
            if failed_by_ip[ip] >= R002_IP_THRESHOLD:
                key = f"R002-{ip}"
                if key not in fired:
                    fired.add(key)
                    decision = DecisionRecord(
                        id=str(uuid.uuid4()),
                        event_id=event.id,
                        event_type=et,
                        severity="CRITICAL",
                        rule_id="R002",
                        title=f"Brute force attempt from {ip} ({failed_by_ip[ip]} attempts)",
                        what_happened=f"{failed_by_ip[ip]} failed login attempts from IP {ip} within {WINDOW_MINUTES} minutes.",
                        why_it_matters="A high volume of failures from a single IP strongly indicates an automated brute-force attack.",
                        business_impact="If successful, attacker gains full system access. Other accounts on the network may also be at risk.",
                        recommended_action=f"Block IP {ip} immediately. Enable account lockout policy. Review affected accounts.",
                        confidence=92,
                        tags=["brute-force", "authentication", "R002"],
                        device=payload.device,
                        created_at=datetime.utcnow(),
                    )

        # ── R001 — Multiple failed logins (same user) ─────────────────────────
        if decision is None and et == "FAILED_LOGIN" and "R001" in enabled_rules:
            user = event.raw.get("user", "unknown")
            if failed_by_user[user] >= R001_USER_THRESHOLD:
                key = f"R001-{user}"
                if key not in fired:
                    fired.add(key)
                    decision = DecisionRecord(
                        id=str(uuid.uuid4()),
                        event_id=event.id,
                        event_type=et,
                        severity="HIGH",
                        rule_id="R001",
                        title=f"Multiple failed logins for '{user}' ({failed_by_user[user]} attempts)",
                        what_happened=f"{failed_by_user[user]} failed login attempts for user '{user}' within {WINDOW_MINUTES} minutes.",
                        why_it_matters="Repeated failed logins for the same account may indicate password guessing or a credential stuffing attack.",
                        business_impact="If the account is compromised, the attacker gains access to all resources available to that user.",
                        recommended_action=f"Lock account '{user}'. Verify with the user. Enforce MFA. Review source IPs.",
                        confidence=85,
                        tags=["authentication", "brute-force", "R001"],
                        device=payload.device,
                        created_at=datetime.utcnow(),
                    )

        # ── R003 — Admin login after failures ─────────────────────────────────
        if decision is None and et == "ADMIN_LOGIN" and "R003" in enabled_rules:
            user = event.raw.get("user", "unknown")
            prior_failures = failed_by_user.get(user, 0)
            rule = _SIMPLE_RULES["ADMIN_LOGIN"]
            if prior_failures > 0:
                # Upgrade to CRITICAL — admin succeeded after failures
                decision = _build_decision(
                    ev, payload.device, rule,
                    override_title=f"Admin login succeeded after {prior_failures} failures — '{user}'",
                    override_confidence=94,
                    override_severity="CRITICAL",
                )
                decision.why_it_matters = (
                    f"Admin account '{user}' logged in successfully after {prior_failures} failed attempts. "
                    "This pattern is consistent with a successful brute-force or credential stuffing attack."
                )
                decision.recommended_action = (
                    f"Immediately verify whether '{user}' made this login. "
                    "If not, suspend the account, reset credentials, and investigate the source IP."
                )
            else:
                # Normal admin login — lower priority
                decision = _build_decision(ev, payload.device, rule)

        # ── R004, R005, R006, R007 — Simple event-type rules ──────────────────
        if decision is None and et in _SIMPLE_RULES:
            rule = _SIMPLE_RULES[et]
            if rule["rule_id"] in enabled_rules:
                # R007 PowerShell — check for high-risk keywords
                if et == "POWERSHELL_EXEC":
                    cmdline = event.raw.get("cmdline", "").lower()
                    high_risk = any(k in cmdline for k in _PS_HIGH_RISK)
                    decision = _build_decision(
                        ev, payload.device, {
                            **rule,
                            "rule_id": "R007",
                            "severity": "CRITICAL" if high_risk else "HIGH",
                            "title": "Suspicious PowerShell execution" + (" — encoded/bypass detected" if high_risk else ""),
                            "confidence": 91 if high_risk else 78,
                        }
                    )
                else:
                    decision = _build_decision(ev, payload.device, rule)

        # ── Save and broadcast ─────────────────────────────────────────────────
        if decision:
            await store.add_decision(decision)
            decisions.append(decision)
            await ws.broadcast({"type": "decision", "data": decision.model_dump(mode="json")})
            logger.info("[%s] %s — %s", decision.rule_id, decision.severity, decision.title)

    return decisions
