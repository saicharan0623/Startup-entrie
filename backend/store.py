"""
In-memory store for decisions, events, and devices.
For the MVP this is sufficient; swap for PostgreSQL in production.
"""
from __future__ import annotations
import threading
from collections import deque
from datetime import datetime
from backend.models import DecisionRecord, EventPayload, DevicePayload


class InMemoryStore:
    def __init__(self, max_decisions: int = 1000, max_events: int = 5000):
        self._lock = threading.Lock()
        self._decisions: deque[dict] = deque(maxlen=max_decisions)
        self._events: deque[dict] = deque(maxlen=max_events)
        self._devices: dict[str, dict] = {}   # keyed by hostname
        self._stats = {
            "total_events": 0,
            "total_decisions": 0,
            "approved": 0,
            "rejected": 0,
            "incorrect": 0,
        }

    # ── Write ─────────────────────────────────────────────────────────────────

    def add_event(self, event: EventPayload, device: DevicePayload) -> None:
        with self._lock:
            self._events.append({**event.model_dump(mode="json"), "device": device.model_dump()})
            self._stats["total_events"] += 1
            # Upsert device
            self._devices[device.hostname] = {
                **device.model_dump(),
                "last_seen": datetime.utcnow().isoformat(),
            }

    def add_decision(self, decision: DecisionRecord) -> None:
        with self._lock:
            self._decisions.appendleft(decision.model_dump(mode="json"))
            self._stats["total_decisions"] += 1

    def set_feedback(self, decision_id: str, action: str, note: str = "") -> bool:
        with self._lock:
            for d in self._decisions:
                if d["id"] == decision_id:
                    d["feedback"] = action
                    d["feedback_note"] = note
                    if action in self._stats:
                        self._stats[action] += 1
                    return True
        return False

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_decisions(self, limit: int = 50, severity: str | None = None) -> list[dict]:
        with self._lock:
            items = list(self._decisions)
        if severity:
            items = [d for d in items if d["severity"].upper() == severity.upper()]
        return items[:limit]

    def get_events(self, limit: int = 100) -> list[dict]:
        with self._lock:
            return list(self._events)[-limit:]

    def get_devices(self) -> list[dict]:
        with self._lock:
            return list(self._devices.values())

    def get_stats(self) -> dict:
        with self._lock:
            return dict(self._stats)


# Singleton
store = InMemoryStore()
