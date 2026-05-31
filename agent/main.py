"""
EntriAlert Agent — main entry point.
Runs three async collection loops and ships telemetry to the backend.

Usage:
    python -m agent.main
    # or
    python agent/main.py
"""
import asyncio
import logging
import sys
from agent.config import settings
from agent.device_info import get_device_info
from agent.models import DeviceInfo
from agent.sender import ApiSender
from agent.collectors import log_collector, process_monitor, network_monitor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("entrialert.agent")


async def run_log_loop(sender: ApiSender) -> None:
    while True:
        logger.info("Collecting security logs...")
        events = log_collector.collect(since_minutes=settings.log_interval // 60 + 1)
        if events:
            logger.info("Log collector: %d events", len(events))
            sender.send(events)
        await asyncio.sleep(settings.log_interval)


async def run_process_loop(sender: ApiSender) -> None:
    while True:
        logger.info("Scanning processes...")
        events = process_monitor.collect()
        if events:
            logger.info("Process monitor: %d events", len(events))
            sender.send(events)
        await asyncio.sleep(settings.process_interval)


async def run_network_loop(sender: ApiSender) -> None:
    while True:
        logger.info("Scanning network connections...")
        events = network_monitor.collect()
        if events:
            logger.info("Network monitor: %d events", len(events))
            sender.send(events)
        await asyncio.sleep(settings.network_interval)


async def main() -> None:
    logger.info("EntriAlert Agent starting...")
    raw_device = get_device_info()
    device = DeviceInfo(**raw_device)
    logger.info("Device: %s (%s) — %s", device.hostname, device.os, device.ip)

    sender = ApiSender(device)

    await asyncio.gather(
        run_log_loop(sender),
        run_process_loop(sender),
        run_network_loop(sender),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Agent stopped.")
