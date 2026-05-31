"""
Rule engine — takes raw SecurityEvents and produces enriched decisions.
Each rule maps an event pattern → decision with confidence + recommended action.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from agent.models import SecurityEvent, EventType, Severity


@dataclass
class Decision:
    event_id: str
    event_type: str
    severity: str
    title: str
    what_happened: str
    why_it_matters: str
    business_impact: str
    recommended_action: str
    confidence: int          # 0-100
    tags: list[str] = field(default_factory=list)


# ── Rule definitions ──────────────────────────────────────────────────────────

def _rule_failed_login(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.FAILED_LOGIN:
        return None
    user = e.raw.get("user", "unknown")
    src_ip = e.raw.get("source_ip", "unknown")
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=Severity.HIGH.value,
        title=f"Failed login attempt for '{user}'",
        what_happened=e.description,
        why_it_matters="Repeated failed logins may indicate a brute-force or credential stuffing attack.",
        business_impact="If successful, attacker gains access to internal systems and data.",
        recommended_action=f"Review login history for '{user}'. If pattern continues, block source IP {src_ip} and enforce MFA.",
        confidence=82,
        tags=["authentication", "brute-force"],
    )


def _rule_admin_login(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.ADMIN_LOGIN:
        return None
    user = e.raw.get("user", "unknown")
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=Severity.MEDIUM.value,
        title=f"Admin login by '{user}'",
        what_happened=e.description,
        why_it_matters="Admin logins grant elevated privileges. Unexpected ones may indicate compromise.",
        business_impact="Admin access can modify systems, exfiltrate data, or disable security controls.",
        recommended_action=f"Verify '{user}' intended this login. If unexpected, suspend session and investigate.",
        confidence=70,
        tags=["authentication", "privilege"],
    )


def _rule_lockout(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.ACCOUNT_LOCKOUT:
        return None
    user = e.raw.get("user", "unknown")
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=Severity.HIGH.value,
        title=f"Account lockout: '{user}'",
        what_happened=e.description,
        why_it_matters="Account lockouts often follow automated brute-force attempts.",
        business_impact="Legitimate user is locked out; attacker may be probing credentials.",
        recommended_action=f"Unlock '{user}' only after verifying identity. Investigate source of failed attempts.",
        confidence=88,
        tags=["authentication", "lockout"],
    )


def _rule_powershell(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.POWERSHELL_EXEC:
        return None
    cmdline = e.raw.get("cmdline", "")
    high_risk = any(k in cmdline.lower() for k in ["-enc", "bypass", "downloadstring", "iex"])
    severity = Severity.CRITICAL.value if high_risk else Severity.HIGH.value
    confidence = 91 if high_risk else 72
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=severity,
        title="PowerShell execution detected",
        what_happened=e.description,
        why_it_matters="PowerShell is frequently abused for fileless malware, lateral movement, and data exfiltration.",
        business_impact="Could indicate active compromise or malware execution on this endpoint.",
        recommended_action="Inspect the full command line. If encoded or downloading content, isolate the endpoint immediately.",
        confidence=confidence,
        tags=["execution", "powershell", "lolbin"],
    )


def _rule_suspicious_process(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.PROCESS_SUSPICIOUS:
        return None
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=Severity.MEDIUM.value,
        title=f"Suspicious process: {e.raw.get('name', 'unknown')}",
        what_happened=e.description,
        why_it_matters="Living-off-the-land binaries (LOLBins) are commonly used to evade detection.",
        business_impact="May indicate an attacker using built-in tools to avoid antivirus detection.",
        recommended_action="Review the process context and parent process. Terminate if unexpected.",
        confidence=65,
        tags=["execution", "lolbin"],
    )


def _rule_suspicious_port(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.SUSPICIOUS_PORT:
        return None
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=Severity.CRITICAL.value,
        title=f"Outbound connection on suspicious port {e.raw.get('remote_port')}",
        what_happened=e.description,
        why_it_matters="This port is commonly used by reverse shells, C2 frameworks, or Tor.",
        business_impact="Active C2 channel could mean the endpoint is fully compromised.",
        recommended_action="Block the outbound connection immediately. Isolate the endpoint and investigate the process.",
        confidence=90,
        tags=["network", "c2", "exfiltration"],
    )


def _rule_outbound_ip(e: SecurityEvent) -> Decision | None:
    if e.event_type != EventType.OUTBOUND_IP:
        return None
    return Decision(
        event_id=e.id,
        event_type=e.event_type.value,
        severity=Severity.LOW.value,
        title=f"Outbound connection to {e.raw.get('remote_ip')}",
        what_happened=e.description,
        why_it_matters="Unexpected outbound connections may indicate data exfiltration or beaconing.",
        business_impact="Low risk unless destination is known-malicious or traffic volume is high.",
        recommended_action="Verify the destination is expected. Check for unusual data volumes.",
        confidence=55,
        tags=["network", "outbound"],
    )


# ── Engine ────────────────────────────────────────────────────────────────────

_RULES = [
    _rule_failed_login,
    _rule_admin_login,
    _rule_lockout,
    _rule_powershell,
    _rule_suspicious_process,
    _rule_suspicious_port,
    _rule_outbound_ip,
]


def process(events: list[SecurityEvent]) -> list[Decision]:
    """Run all rules against all events. Returns one Decision per matched event."""
    decisions: list[Decision] = []
    for event in events:
        for rule in _RULES:
            decision = rule(event)
            if decision:
                decisions.append(decision)
                break  # first matching rule wins
    return decisions
