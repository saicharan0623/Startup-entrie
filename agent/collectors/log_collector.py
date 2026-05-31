"""
Windows Security Event Log collector.
Reads Event IDs from the Security log:
  4625 — failed login
  4624 — successful login (filtered for admin/elevated)
  4740 — account lockout
Falls back to a stub on non-Windows systems.
"""
import platform
import logging
from datetime import datetime, timedelta
from agent.models import SecurityEvent, EventType, Severity

logger = logging.getLogger(__name__)

# Event IDs we care about
_FAILED_LOGIN = 4625
_SUCCESS_LOGIN = 4624
_LOCKOUT = 4740

# Admin logon types (2=interactive, 10=remote interactive)
_ADMIN_LOGON_TYPES = {2, 10}


def collect(since_minutes: int = 5) -> list[SecurityEvent]:
    """Return security log events from the last `since_minutes` minutes."""
    if platform.system() != "Windows":
        return _stub_events()
    return _collect_windows(since_minutes)


def _collect_windows(since_minutes: int) -> list[SecurityEvent]:
    events: list[SecurityEvent] = []
    try:
        import win32evtlog
        import win32evtlogutil
        import win32con

        server = None  # local machine
        log_type = "Security"
        hand = win32evtlog.OpenEventLog(server, log_type)
        flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
        cutoff = datetime.utcnow() - timedelta(minutes=since_minutes)

        while True:
            records = win32evtlog.ReadEventLog(hand, flags, 0)
            if not records:
                break
            for rec in records:
                ts = datetime(*rec.TimeGenerated.timetuple()[:6])
                if ts < cutoff:
                    # Records are newest-first; stop when we pass the window
                    win32evtlog.CloseEventLog(hand)
                    return events

                eid = rec.EventID & 0xFFFF
                strings = rec.StringInserts or []

                if eid == _FAILED_LOGIN:
                    user = strings[5] if len(strings) > 5 else "unknown"
                    ip = strings[19] if len(strings) > 19 else "unknown"
                    events.append(SecurityEvent(
                        event_type=EventType.FAILED_LOGIN,
                        severity=Severity.MEDIUM,
                        source="log_collector",
                        description=f"Failed login for user '{user}' from {ip}",
                        raw={"event_id": eid, "user": user, "source_ip": ip, "timestamp": ts.isoformat()},
                    ))

                elif eid == _SUCCESS_LOGIN:
                    logon_type = int(strings[8]) if len(strings) > 8 and strings[8].isdigit() else 0
                    user = strings[5] if len(strings) > 5 else "unknown"
                    if logon_type in _ADMIN_LOGON_TYPES:
                        events.append(SecurityEvent(
                            event_type=EventType.ADMIN_LOGIN,
                            severity=Severity.LOW,
                            source="log_collector",
                            description=f"Admin/interactive login by '{user}' (logon type {logon_type})",
                            raw={"event_id": eid, "user": user, "logon_type": logon_type, "timestamp": ts.isoformat()},
                        ))

                elif eid == _LOCKOUT:
                    user = strings[0] if strings else "unknown"
                    events.append(SecurityEvent(
                        event_type=EventType.ACCOUNT_LOCKOUT,
                        severity=Severity.HIGH,
                        source="log_collector",
                        description=f"Account lockout for '{user}'",
                        raw={"event_id": eid, "user": user, "timestamp": ts.isoformat()},
                    ))

        win32evtlog.CloseEventLog(hand)
    except Exception as exc:
        logger.warning("log_collector error: %s", exc)
    return events


def _stub_events() -> list[SecurityEvent]:
    """Return fake events for non-Windows dev/testing."""
    return [
        SecurityEvent(
            event_type=EventType.FAILED_LOGIN,
            severity=Severity.MEDIUM,
            source="log_collector_stub",
            description="[STUB] Failed login for user 'admin' from 10.0.0.99",
            raw={"stub": True},
        )
    ]
