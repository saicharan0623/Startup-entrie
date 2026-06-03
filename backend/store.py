"""
MongoDB-backed store — replaces the in-memory store.
All methods are async. The pipeline and routes await them directly.
"""
from __future__ import annotations
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.models import DecisionRecord, EventPayload, DevicePayload
from backend.database import get_db

logger = logging.getLogger(__name__)

CONTROL_MAP = {
    "FAILED_LOGIN":       ("Access Control",      "Event ID 4625 — Failed login logs"),
    "ACCOUNT_LOCKOUT":    ("Access Control",       "Event ID 4740 — Account lockout logs"),
    "ADMIN_LOGIN":        ("Privileged Access",    "Event ID 4624 — Admin login logs"),
    "POWERSHELL_EXEC":    ("Endpoint Protection",  "Event ID 4688 — Process execution logs"),
    "PROCESS_SUSPICIOUS": ("Endpoint Protection",  "Event ID 4688 — Process execution logs"),
    "UNKNOWN_SCRIPT":     ("Endpoint Protection",  "Script execution logs"),
    "SUSPICIOUS_PORT":    ("Network Security",     "Network connection logs"),
    "OUTBOUND_IP":        ("Network Security",     "Outbound connection logs"),
}


def _db() -> AsyncIOMotorDatabase:
    return get_db()


def _clean(doc: dict) -> dict:
    """Remove MongoDB _id before returning to API."""
    doc.pop("_id", None)
    return doc


# ── Events ────────────────────────────────────────────────────────────────────

async def add_event(event: EventPayload, device: DevicePayload) -> None:
    doc = {**event.model_dump(mode="json"), "device": device.model_dump()}
    try:
        await _db().events.update_one(
            {"id": doc["id"]},
            {"$set": doc},
            upsert=True,
        )
    except Exception as e:
        logger.warning("add_event error: %s", e)

    # Upsert device
    await _db().devices.update_one(
        {"hostname": device.hostname},
        {"$set": {**device.model_dump(), "last_seen": datetime.utcnow().isoformat()}},
        upsert=True,
    )


async def get_events(limit: int = 100) -> list[dict]:
    cursor = _db().events.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    return [doc async for doc in cursor]


# ── Decisions ─────────────────────────────────────────────────────────────────

async def add_decision(decision: DecisionRecord) -> None:
    doc = decision.model_dump(mode="json")
    try:
        await _db().decisions.update_one(
            {"id": doc["id"]},
            {"$set": doc},
            upsert=True,
        )
    except Exception as e:
        logger.warning("add_decision error: %s", e)


async def get_decision(decision_id: str) -> dict | None:
    doc = await _db().decisions.find_one({"id": decision_id}, {"_id": 0})
    return doc


async def get_decisions(limit: int = 50, severity: str | None = None) -> list[dict]:
    query: dict = {}
    if severity:
        query["severity"] = severity.upper()
    cursor = _db().decisions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]


async def set_feedback(decision_id: str, action: str, note: str = "") -> bool:
    result = await _db().decisions.update_one(
        {"id": decision_id},
        {"$set": {"feedback": action, "feedback_note": note}},
    )
    return result.matched_count > 0


# ── Devices ───────────────────────────────────────────────────────────────────

async def get_devices() -> list[dict]:
    cursor = _db().devices.find({}, {"_id": 0}).sort("last_seen", -1)
    return [doc async for doc in cursor]


# ── Stats ─────────────────────────────────────────────────────────────────────

async def get_stats() -> dict:
    total_events = await _db().events.count_documents({})
    total_decisions = await _db().decisions.count_documents({})
    approved = await _db().decisions.count_documents({"feedback": "approve"})
    rejected = await _db().decisions.count_documents({"feedback": "reject"})
    incorrect = await _db().decisions.count_documents({"feedback": "incorrect"})
    return {
        "total_events": total_events,
        "total_decisions": total_decisions,
        "approved": approved,
        "rejected": rejected,
        "incorrect": incorrect,
    }


# ── Compliance ────────────────────────────────────────────────────────────────

async def get_compliance_summary() -> dict:
    cursor = _db().decisions.find({}, {"_id": 0}).sort("created_at", -1).limit(500)
    decisions = [doc async for doc in cursor]

    rows = []
    unresolved = critical_gaps = resolved = 0

    for d in decisions:
        et = d.get("event_type", "")
        control, evidence = CONTROL_MAP.get(et, ("Security Monitoring", "Agent event log"))
        fb = d.get("feedback")

        if fb == "approve":
            status = "Resolved"
            resolved += 1
        elif fb == "reject":
            status = "Rejected"
        elif d.get("severity") in ("CRITICAL", "HIGH"):
            status = "Critical"
            critical_gaps += 1
            unresolved += 1
        else:
            status = "Unresolved"
            unresolved += 1

        rows.append({
            "id": d.get("id"),
            "event": d.get("title", et),
            "device": (d.get("device") or {}).get("hostname", "—"),
            "control_area": control,
            "evidence": evidence,
            "risk_status": status,
            "severity": d.get("severity", "LOW"),
            "created_at": d.get("created_at", ""),
        })

    return {
        "total": len(rows),
        "unresolved": unresolved,
        "critical_gaps": critical_gaps,
        "resolved": resolved,
        "items": rows,
    }
