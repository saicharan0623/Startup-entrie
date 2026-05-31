"""
Pipeline — wires telemetry → rule engine → store → WebSocket broadcast.
Imports the agent's rule engine directly (shared logic).
"""
from __future__ import annotations
import logging
import uuid
from datetime import datetime
from backend.models import TelemetryPayload, DecisionRecord, EventPayload
from backend.store import InMemoryStore
from backend.ws_manager import WebSocketManager

logger = logging.getLogger(__name__)

# ── Inline rule engine (mirrors agent/rule_engine.py, works on dicts) ─────────

RULES = {
    "FAILED_LOGIN": {
        "title": "Failed login attempt",
        "why": "Repeated failed logins may indicate brute-force or credential stuffing.",
        "impact": "If successful, attacker gains access to internal systems.",
        "action": "Review login history. If pattern continues, block source IP and enforce MFA.",
        "confidence": 82,
        "severity": "HIGH",
        "tags": ["authentication", "brute-force"],
    },
    "ADMIN_LOGIN": {
        "title": "Admin login detected",
        "why": "Admin logins grant elevated privileges. Unexpected ones may indicate compromise.",
        "impact": "Admin access can modify systems, exfiltrate data, or disable security controls.",
        "action": "Verify the login was intentional. If unexpected, suspend session and investigate.",
        "confidence": 70,
        "severity": "MEDIUM",
        "tags": ["authentication", "privilege"],
    },
    "ACCOUNT_LOCKOUT": {
        "title": "Account lockout",
        "why": "Lockouts often follow automated brute-force attempts.",
        "impact": "Legitimate user locked out; attacker may be probing credentials.",
        "action": "Unlock only after verifying identity. Investigate source of failed attempts.",
        "confidence": 88,
        "severity": "HIGH",
        "tags": ["authentication", "lockout"],
    },
    "POWERSHELL_EXEC": {
        "title": "PowerShell execution detected",
        "why": "PowerShell is frequently abused for fileless malware and lateral movement.",
        "impact": "Could indicate active compromise or malware execution on this endpoint.",
        "action": "Inspect the full command line. If encoded or downloading content, isolate endpoint.",
        "confidence": 85,
        "severity": "HIGH",
        "tags": ["execution", "powershell"],
    },
    "PROCESS_SUSPICIOUS": {
        "title": "Suspicious process detected",
        "why": "LOLBins are commonly used to evade detection.",
        "impact": "May indicate an attacker using built-in tools to avoid antivirus.",
        "action": "Review process context and parent process. Terminate if unexpected.",
        "confidence": 65,
        "severity": "MEDIUM",
        "tags": ["execution", "lolbin"],
    },
    "UNKNOWN_SCRIPT": {
        "title": "Unknown script execution",
        "why": "Scripts from unknown sources may execute malicious payloads.",
        "impact": "Could lead to data theft, persistence, or further compromise.",
        "action": "Identify the script source. Block execution if origin is unknown.",
        "confidence": 72,
        "severity": "MEDIUM",
        "tags": ["execution", "script"],
    },
    "SUSPICIOUS_PORT": {
        "title": "Outbound connection on suspicious port",
        "why": "This port is commonly used by reverse shells or C2 frameworks.",
        "impact": "Active C2 channel could mean the endpoint is fully compromised.",
        "action": "Block the connection immediately. Isolate the endpoint and investigate.",
        "confidence": 90,
        "severity": "CRITICAL",
        "tags": ["network", "c2"],
    },
    "OUTBOUND_IP": {
        "title": "Outbound connection to external IP",
        "why": "Unexpected outbound connections may indicate beaconing or exfiltration.",
        "impact": "Low risk unless destination is known-malicious or traffic volume is high.",
        "action": "Verify the destination is expected. Check for unusual data volumes.",
        "confidence": 55,
        "severity": "LOW",
        "tags": ["network", "outbound"],
    },
}


def _make_decision(event: EventPayload, device) -> DecisionRecord | None:
    rule = RULES.get(event.event_type)
    if not rule:
        return None

    user = event.raw.get("user", "")
    src_ip = event.raw.get("source_ip", "")
    port = event.raw.get("remote_port", "")

    title = rule["title"]
    if user:
        title += f" — {user}"
    if port:
        title += f" (port {port})"

    return DecisionRecord(
        id=str(uuid.uuid4()),
        event_id=event.id,
        event_type=event.event_type,
        severity=rule["severity"],
        title=title,
        what_happened=event.description,
        why_it_matters=rule["why"],
        business_impact=rule["impact"],
        recommended_action=rule["action"],
        confidence=rule["confidence"],
        tags=rule["tags"],
        device=device,
        created_at=datetime.utcnow(),
    )


async def process_telemetry(
    payload: TelemetryPayload,
    store: InMemoryStore,
    ws: WebSocketManager,
) -> list[DecisionRecord]:
    decisions: list[DecisionRecord] = []

    for event in payload.events:
        # Attach device to event
        event_with_device = EventPayload(**{**event.model_dump(), "device": payload.device.model_dump()})
        store.add_event(event_with_device, payload.device)

        decision = _make_decision(event, payload.device)
        if decision:
            store.add_decision(decision)
            decisions.append(decision)

            # Broadcast to all connected UI clients
            await ws.broadcast({
                "type": "decision",
                "data": decision.model_dump(mode="json"),
            })
            logger.info("Decision: [%s] %s", decision.severity, decision.title)

    return decisions
