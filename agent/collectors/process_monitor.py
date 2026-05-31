"""
Process monitor — detects suspicious process activity.
Flags: PowerShell, cmd with encoded args, unknown scripts, common LOLBins.
"""
import logging
import psutil
from agent.models import SecurityEvent, EventType, Severity

logger = logging.getLogger(__name__)

# Executables that are always interesting
SUSPICIOUS_NAMES = {
    "powershell.exe", "powershell",
    "cmd.exe",
    "wscript.exe", "cscript.exe",
    "mshta.exe", "rundll32.exe",
    "regsvr32.exe", "certutil.exe",
    "bitsadmin.exe", "wmic.exe",
    "msiexec.exe",
}

# Command-line fragments that raise severity
HIGH_RISK_ARGS = [
    "-encodedcommand", "-enc ", "-nop ", "-windowstyle hidden",
    "invoke-expression", "iex(", "downloadstring",
    "bypass", "-exec bypass",
]

SCRIPT_EXTENSIONS = {".ps1", ".vbs", ".js", ".bat", ".cmd", ".hta"}


def collect() -> list[SecurityEvent]:
    events: list[SecurityEvent] = []
    try:
        for proc in psutil.process_iter(["pid", "name", "cmdline", "username", "exe"]):
            try:
                info = proc.info
                name = (info.get("name") or "").lower()
                cmdline = " ".join(info.get("cmdline") or []).lower()
                exe = (info.get("exe") or "").lower()

                # PowerShell execution
                if "powershell" in name:
                    severity = Severity.HIGH if any(a in cmdline for a in HIGH_RISK_ARGS) else Severity.MEDIUM
                    events.append(SecurityEvent(
                        event_type=EventType.POWERSHELL_EXEC,
                        severity=severity,
                        source="process_monitor",
                        description=f"PowerShell running (PID {info['pid']}): {cmdline[:120]}",
                        raw={"pid": info["pid"], "name": name, "cmdline": cmdline[:300], "user": info.get("username")},
                    ))

                # Other suspicious executables
                elif name in SUSPICIOUS_NAMES:
                    events.append(SecurityEvent(
                        event_type=EventType.PROCESS_SUSPICIOUS,
                        severity=Severity.MEDIUM,
                        source="process_monitor",
                        description=f"Suspicious process '{name}' (PID {info['pid']})",
                        raw={"pid": info["pid"], "name": name, "cmdline": cmdline[:300], "user": info.get("username")},
                    ))

                # Unknown script files being executed
                else:
                    for ext in SCRIPT_EXTENSIONS:
                        if ext in cmdline:
                            events.append(SecurityEvent(
                                event_type=EventType.UNKNOWN_SCRIPT,
                                severity=Severity.MEDIUM,
                                source="process_monitor",
                                description=f"Script execution detected (PID {info['pid']}): {cmdline[:120]}",
                                raw={"pid": info["pid"], "name": name, "cmdline": cmdline[:300]},
                            ))
                            break

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    except Exception as exc:
        logger.warning("process_monitor error: %s", exc)
    return events
