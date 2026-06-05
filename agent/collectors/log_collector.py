"""
Windows Security Event Log collector.

Event IDs collected:
  4625  — failed login                  → R001 / R002
  4624  — successful login (admin)      → R003
  4740  — account lockout
  1102  — audit log cleared             → R004
  4719  — audit policy changed          → R004
  4720  — new user account created      → R005
  4732  — user added to admin group     → R005
  5001  — Defender real-time disabled   → R006
  7036  — service state change          → R006 (Defender service)

Falls back to a richer stub on non-Windows systems.
"""
import platform
import logging
from datetime import datetime, timedelta
from agent.models import SecurityEvent, EventType, Severity

logger = logging.getLogger(__name__)

# ── Event ID constants ────────────────────────────────────────────────────────
_FAILED_LOGIN       = 4625
_SUCCESS_LOGIN      = 4624
_LOCKOUT            = 4740
_AUDIT_LOG_CLEARED  = 1102
_AUDIT_POLICY_CHANGE = 4719
_NEW_USER_CREATED   = 4720
_USER_ADDED_TO_GROUP = 4732
_DEFENDER_DISABLED  = 5001   # WinDefend / Security Center event
_SERVICE_CHANGE     = 7036   # System log — service stopped/started

# Admin group SID (Administrators)
_ADMIN_GROUP_SID = "S-1-5-32-544"

# Admin logon types (2=interactive, 10=remote interactive)
_ADMIN_LOGON_TYPES = {2, 10}

# Defender-related service names
_DEFENDER_SERVICES = {"windefend", "sense", "wdnissvc", "mpssvc"}


def collect(since_minutes: int = 5) -> list[SecurityEvent]:
    """Return security log events from the last `since_minutes` minutes."""
    if platform.system() != "Windows":
        return _stub_events()
    return _collect_windows(since_minutes)


def _collect_windows(since_minutes: int) -> list[SecurityEvent]:
    events: list[SecurityEvent] = []
    try:
        import win32evtlog

        cutoff = datetime.utcnow() - timedelta(minutes=since_minutes)
        flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ

        # ── Security log ─────────────────────────────────────────────────────
        try:
            hand = win32evtlog.OpenEventLog(None, "Security")
            while True:
                records = win32evtlog.ReadEventLog(hand, flags, 0)
                if not records:
                    break
                for rec in records:
                    ts = datetime(*rec.TimeGenerated.timetuple()[:6])
                    if ts < cutoff:
                        win32evtlog.CloseEventLog(hand)
                        hand = None
                        break
                    eid = rec.EventID & 0xFFFF
                    strings = rec.StringInserts or []
                    ev = _parse_security_event(eid, strings, ts)
                    if ev:
                        events.append(ev)
                if hand is None:
                    break
            if hand:
                win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.warning("Security log error: %s", exc)

        # ── System log (for Defender service state — Event 7036) ─────────────
        try:
            hand = win32evtlog.OpenEventLog(None, "System")
            while True:
                records = win32evtlog.ReadEventLog(hand, flags, 0)
                if not records:
                    break
                for rec in records:
                    ts = datetime(*rec.TimeGenerated.timetuple()[:6])
                    if ts < cutoff:
                        win32evtlog.CloseEventLog(hand)
                        hand = None
                        break
                    eid = rec.EventID & 0xFFFF
                    strings = rec.StringInserts or []
                    if eid == _SERVICE_CHANGE:
                        service = (strings[0] if strings else "").lower()
                        state = (strings[1] if len(strings) > 1 else "").lower()
                        if any(d in service for d in _DEFENDER_SERVICES) and "stopped" in state:
                            events.append(SecurityEvent(
                                event_type=EventType.DEFENDER_DISABLED,
                                severity=Severity.CRITICAL,
                                source="log_collector",
                                description=f"Windows Defender service '{strings[0]}' stopped",
                                raw={
                                    "event_id": eid,
                                    "service": strings[0],
                                    "state": strings[1] if len(strings) > 1 else "",
                                    "timestamp": ts.isoformat(),
                                },
                            ))
                if hand is None:
                    break
            if hand:
                win32evtlog.CloseEventLog(hand)
        except Exception as exc:
            logger.warning("System log error: %s", exc)

    except Exception as exc:
        logger.warning("log_collector error: %s", exc)

    return events


def _parse_security_event(
    eid: int, strings: list[str], ts: datetime
) -> SecurityEvent | None:
    """Parse a single Security log event into a SecurityEvent."""

    # ── 4625 — Failed login ───────────────────────────────────────────────────
    if eid == _FAILED_LOGIN:
        user = strings[5] if len(strings) > 5 else "unknown"
        ip   = strings[19] if len(strings) > 19 else "unknown"
        return SecurityEvent(
            event_type=EventType.FAILED_LOGIN,
            severity=Severity.MEDIUM,
            source="log_collector",
            description=f"Failed login for user '{user}' from {ip}",
            raw={
                "event_id": eid,
                "user": user,
                "source_ip": ip,
                "timestamp": ts.isoformat(),
            },
        )

    # ── 4624 — Successful login (admin interactive) ───────────────────────────
    if eid == _SUCCESS_LOGIN:
        logon_type = int(strings[8]) if len(strings) > 8 and strings[8].isdigit() else 0
        user = strings[5] if len(strings) > 5 else "unknown"
        if logon_type in _ADMIN_LOGON_TYPES:
            return SecurityEvent(
                event_type=EventType.ADMIN_LOGIN,
                severity=Severity.LOW,
                source="log_collector",
                description=f"Admin/interactive login by '{user}' (logon type {logon_type})",
                raw={
                    "event_id": eid,
                    "user": user,
                    "logon_type": logon_type,
                    "timestamp": ts.isoformat(),
                },
            )

    # ── 4740 — Account lockout ────────────────────────────────────────────────
    if eid == _LOCKOUT:
        user = strings[0] if strings else "unknown"
        return SecurityEvent(
            event_type=EventType.ACCOUNT_LOCKOUT,
            severity=Severity.HIGH,
            source="log_collector",
            description=f"Account lockout for '{user}'",
            raw={"event_id": eid, "user": user, "timestamp": ts.isoformat()},
        )

    # ── 1102 — Audit log cleared (R004) ──────────────────────────────────────
    if eid == _AUDIT_LOG_CLEARED:
        user = strings[1] if len(strings) > 1 else "unknown"
        return SecurityEvent(
            event_type=EventType.AUDIT_LOG_DISABLED,
            severity=Severity.CRITICAL,
            source="log_collector",
            description=f"Security audit log was cleared by '{user}'",
            raw={"event_id": eid, "user": user, "timestamp": ts.isoformat()},
        )

    # ── 4719 — Audit policy changed (R004) ───────────────────────────────────
    if eid == _AUDIT_POLICY_CHANGE:
        user = strings[0] if strings else "unknown"
        return SecurityEvent(
            event_type=EventType.AUDIT_LOG_DISABLED,
            severity=Severity.CRITICAL,
            source="log_collector",
            description=f"Audit policy was modified by '{user}'",
            raw={"event_id": eid, "user": user, "timestamp": ts.isoformat()},
        )

    # ── 4720 — New user account created (R005) ────────────────────────────────
    if eid == _NEW_USER_CREATED:
        new_user = strings[0] if strings else "unknown"
        created_by = strings[4] if len(strings) > 4 else "unknown"
        return SecurityEvent(
            event_type=EventType.NEW_ADMIN_CREATED,
            severity=Severity.HIGH,
            source="log_collector",
            description=f"New user account '{new_user}' created by '{created_by}'",
            raw={
                "event_id": eid,
                "new_user": new_user,
                "created_by": created_by,
                "timestamp": ts.isoformat(),
            },
        )

    # ── 4732 — User added to Administrators group (R005) ─────────────────────
    if eid == _USER_ADDED_TO_GROUP:
        member = strings[0] if strings else "unknown"
        group_sid = strings[2] if len(strings) > 2 else ""
        # Only care about Administrators group
        if _ADMIN_GROUP_SID in group_sid or "administrator" in (strings[1] if len(strings) > 1 else "").lower():
            return SecurityEvent(
                event_type=EventType.NEW_ADMIN_CREATED,
                severity=Severity.HIGH,
                source="log_collector",
                description=f"User '{member}' added to Administrators group",
                raw={
                    "event_id": eid,
                    "member": member,
                    "group": strings[1] if len(strings) > 1 else "Administrators",
                    "timestamp": ts.isoformat(),
                },
            )

    # ── 5001 — Defender real-time protection disabled (R006) ─────────────────
    if eid == _DEFENDER_DISABLED:
        return SecurityEvent(
            event_type=EventType.DEFENDER_DISABLED,
            severity=Severity.CRITICAL,
            source="log_collector",
            description="Windows Defender real-time protection was disabled",
            raw={"event_id": eid, "timestamp": ts.isoformat()},
        )

    return None


def _stub_events() -> list[SecurityEvent]:
    """
    Rich stub for non-Windows dev/testing.
    Covers all R001–R007 event types so the full pipeline can be tested.
    """
    import random
    now = datetime.utcnow().isoformat()
    pool = [
        SecurityEvent(
            event_type=EventType.FAILED_LOGIN,
            severity=Severity.MEDIUM,
            source="stub",
            description="[STUB] Failed login for user 'admin' from 10.0.0.99",
            raw={"event_id": 4625, "user": "admin", "source_ip": "10.0.0.99", "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.FAILED_LOGIN,
            severity=Severity.MEDIUM,
            source="stub",
            description="[STUB] Failed login for user 'admin' from 10.0.0.99",
            raw={"event_id": 4625, "user": "admin", "source_ip": "10.0.0.99", "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.FAILED_LOGIN,
            severity=Severity.MEDIUM,
            source="stub",
            description="[STUB] Failed login for user 'admin' from 10.0.0.99",
            raw={"event_id": 4625, "user": "admin", "source_ip": "10.0.0.99", "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.ADMIN_LOGIN,
            severity=Severity.LOW,
            source="stub",
            description="[STUB] Admin login by 'administrator'",
            raw={"event_id": 4624, "user": "administrator", "logon_type": 2, "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.AUDIT_LOG_DISABLED,
            severity=Severity.CRITICAL,
            source="stub",
            description="[STUB] Security audit log cleared by 'sysadmin'",
            raw={"event_id": 1102, "user": "sysadmin", "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.NEW_ADMIN_CREATED,
            severity=Severity.HIGH,
            source="stub",
            description="[STUB] New user 'backdoor_user' created by 'admin'",
            raw={"event_id": 4720, "new_user": "backdoor_user", "created_by": "admin", "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.DEFENDER_DISABLED,
            severity=Severity.CRITICAL,
            source="stub",
            description="[STUB] Windows Defender real-time protection disabled",
            raw={"event_id": 5001, "timestamp": now, "stub": True},
        ),
        SecurityEvent(
            event_type=EventType.POWERSHELL_EXEC,
            severity=Severity.HIGH,
            source="stub",
            description="[STUB] PowerShell executed with encoded command",
            raw={"event_id": 4688, "cmdline": "powershell -enc aGVsbG8=", "timestamp": now, "stub": True},
        ),
    ]
    # Return a random subset to simulate varied telemetry
    return random.sample(pool, k=min(3, len(pool)))
