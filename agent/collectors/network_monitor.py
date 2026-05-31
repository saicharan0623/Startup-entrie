"""
Network monitor — outbound connections, DNS, suspicious ports.
Uses psutil for connection enumeration.
"""
import logging
import socket
import psutil
from agent.models import SecurityEvent, EventType, Severity

logger = logging.getLogger(__name__)

# Ports that are suspicious for outbound traffic
SUSPICIOUS_PORTS = {
    4444, 4445, 1337, 31337,   # common reverse shells / metasploit
    6667, 6668, 6669,           # IRC (often C2)
    9001, 9030,                 # Tor
    8080, 8443,                 # alt HTTP/HTTPS (flag if unexpected)
}

# RFC1918 private ranges — outbound to these is normal
def _is_private(ip: str) -> bool:
    try:
        parts = list(map(int, ip.split(".")))
        return (
            parts[0] == 10
            or (parts[0] == 172 and 16 <= parts[1] <= 31)
            or (parts[0] == 192 and parts[1] == 168)
            or parts[0] == 127
        )
    except Exception:
        return False


def _reverse_dns(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return ip


def collect() -> list[SecurityEvent]:
    events: list[SecurityEvent] = []
    seen_ips: set[str] = set()

    try:
        conns = psutil.net_connections(kind="inet")
        for conn in conns:
            if conn.status != "ESTABLISHED":
                continue
            if not conn.raddr:
                continue

            remote_ip = conn.raddr.ip
            remote_port = conn.raddr.port

            # Skip private/loopback
            if _is_private(remote_ip):
                continue

            # Suspicious port
            if remote_port in SUSPICIOUS_PORTS:
                events.append(SecurityEvent(
                    event_type=EventType.SUSPICIOUS_PORT,
                    severity=Severity.HIGH,
                    source="network_monitor",
                    description=f"Outbound connection to {remote_ip}:{remote_port} (suspicious port)",
                    raw={"remote_ip": remote_ip, "remote_port": remote_port, "pid": conn.pid},
                ))

            # General outbound to public IP (deduplicated)
            elif remote_ip not in seen_ips:
                seen_ips.add(remote_ip)
                hostname = _reverse_dns(remote_ip)
                events.append(SecurityEvent(
                    event_type=EventType.OUTBOUND_IP,
                    severity=Severity.LOW,
                    source="network_monitor",
                    description=f"Outbound connection to {hostname} ({remote_ip}:{remote_port})",
                    raw={"remote_ip": remote_ip, "remote_port": remote_port, "hostname": hostname, "pid": conn.pid},
                ))

    except Exception as exc:
        logger.warning("network_monitor error: %s", exc)

    return events
