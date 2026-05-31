"""
API sender — ships telemetry to the backend with retry + local cache fallback.
"""
from __future__ import annotations
import logging
import requests
from agent.models import Telemetry, DeviceInfo, SecurityEvent
from agent.cache import LocalCache
from agent.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 8  # seconds


class ApiSender:
    def __init__(self, device: DeviceInfo):
        self.device = device
        self.cache = LocalCache(settings.cache_path, max_size=settings.buffer_size * 10)
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": settings.api_key,
        }

    def send(self, events: list[SecurityEvent]) -> bool:
        """
        Try to send events. On failure, cache them.
        Also flushes any previously cached events on success.
        Returns True if sent successfully.
        """
        if not events:
            return True

        payload = Telemetry(
            device=self.device,
            events=events,
        )

        try:
            resp = requests.post(
                f"{settings.api_url}/api/telemetry",
                data=payload.model_dump_json(),
                headers=self.headers,
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            logger.info("Sent %d events to backend", len(events))

            # Flush any cached events now that we're connected
            cached = self.cache.flush()
            if cached:
                self._send_raw(cached)

            return True

        except Exception as exc:
            logger.warning("Send failed (%s) — caching %d events", exc, len(events))
            self.cache.push(events)
            return False

    def _send_raw(self, raw_events: list[dict]) -> None:
        """Re-send previously cached raw event dicts."""
        try:
            resp = requests.post(
                f"{settings.api_url}/api/telemetry/raw",
                json={"device": self.device.model_dump(), "events": raw_events},
                headers=self.headers,
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            logger.info("Flushed %d cached events", len(raw_events))
        except Exception as exc:
            logger.warning("Cache flush failed: %s", exc)
