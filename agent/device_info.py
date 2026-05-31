"""Collect static device information."""
import socket
import platform
import uuid
import psutil


def get_device_info() -> dict:
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
    except Exception:
        ip = "unknown"

    # Get MAC from first non-loopback interface
    mac = "unknown"
    try:
        for iface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if addr.family.name in ("AF_LINK", "AF_PACKET") or addr.family == -1:
                    raw = addr.address.replace("-", ":").lower()
                    if raw and raw != "00:00:00:00:00:00":
                        mac = raw
                        break
            if mac != "unknown":
                break
    except Exception:
        pass

    return {
        "hostname": hostname,
        "os": f"{platform.system()} {platform.release()}",
        "user": platform.node(),
        "ip": ip,
        "mac": mac,
    }
