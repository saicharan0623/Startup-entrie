"""
Local cache — buffers events when the backend is unreachable.
Persists to a JSON file so events survive agent restarts.
"""
from __future__ import annotations
import json
import logging
import os
from agent.models import SecurityEvent

logger = logging.getLogger(__name__)


class LocalCache:
    def __init__(self, path: str, max_size: int = 500):
        self.path = path
        self.max_size = max_size
        self._buffer: list[dict] = []
        self._load()

    def _load(self) -> None:
        if os.path.exists(self.path):
            try:
                with open(self.path, "r") as f:
                    self._buffer = json.load(f)
                logger.info("Loaded %d cached events from %s", len(self._buffer), self.path)
            except Exception as exc:
                logger.warning("Could not load cache: %s", exc)
                self._buffer = []

    def _save(self) -> None:
        try:
            with open(self.path, "w") as f:
                json.dump(self._buffer, f)
        except Exception as exc:
            logger.warning("Could not save cache: %s", exc)

    def push(self, events: list[SecurityEvent]) -> None:
        for e in events:
            self._buffer.append(e.model_dump(mode="json"))
        # Trim to max size (drop oldest)
        if len(self._buffer) > self.max_size:
            self._buffer = self._buffer[-self.max_size:]
        self._save()

    def flush(self) -> list[dict]:
        """Return all buffered events and clear the cache."""
        items = list(self._buffer)
        self._buffer = []
        self._save()
        return items

    def size(self) -> int:
        return len(self._buffer)
