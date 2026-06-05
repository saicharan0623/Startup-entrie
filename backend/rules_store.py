"""
Rules store — seeds R001-R010 into MongoDB and manages enabled/disabled state.
"""
from __future__ import annotations
import logging
from backend.database import get_db

logger = logging.getLogger(__name__)

# ── Rule definitions (source of truth) ───────────────────────────────────────

BETA_RULES = [
    {
        "rule_id": "R001",
        "name": "Multiple Failed Login Attempts",
        "severity": "HIGH",
        "description": "Triggered when the same user has multiple failed login attempts within a short time.",
        "purpose": "Detects possible password guessing or unauthorized login attempts.",
        "enabled": True,
    },
    {
        "rule_id": "R002",
        "name": "Brute Force Attempt",
        "severity": "CRITICAL",
        "description": "Triggered when many failed login attempts come from the same IP address within a short time.",
        "purpose": "Detects possible brute-force activity.",
        "enabled": True,
    },
    {
        "rule_id": "R003",
        "name": "Successful Admin Login After Failures",
        "severity": "CRITICAL",
        "description": "Triggered when an admin login succeeds after multiple failed attempts.",
        "purpose": "Detects possible account compromise.",
        "enabled": True,
    },
    {
        "rule_id": "R004",
        "name": "Audit Logging Disabled",
        "severity": "CRITICAL",
        "description": "Triggered when Windows audit logging is disabled or modified.",
        "purpose": "Detects attempts to hide activity or reduce traceability.",
        "enabled": True,
    },
    {
        "rule_id": "R005",
        "name": "New Local Admin Created",
        "severity": "HIGH",
        "description": "Triggered when a new local administrator account is created.",
        "purpose": "Detects possible privilege escalation or unauthorized admin creation.",
        "enabled": True,
    },
    {
        "rule_id": "R006",
        "name": "Windows Defender Disabled",
        "severity": "CRITICAL",
        "description": "Triggered when Windows Defender or endpoint protection is disabled.",
        "purpose": "Detects when a device becomes exposed to malware or attacks.",
        "enabled": True,
    },
    {
        "rule_id": "R007",
        "name": "Suspicious PowerShell Execution",
        "severity": "HIGH",
        "description": "Triggered when suspicious PowerShell commands or scripts are executed.",
        "purpose": "Detects possible malware execution, script abuse, or attacker activity.",
        "enabled": True,
    },
    {
        "rule_id": "R008",
        "name": "Endpoint Offline",
        "severity": "MEDIUM",
        "description": "Triggered when an enrolled Windows agent stops sending logs for a defined time period.",
        "purpose": "Detects disconnected or unavailable endpoints.",
        "enabled": True,
    },
    {
        "rule_id": "R009",
        "name": "Repeated Duplicate Events",
        "severity": "MEDIUM",
        "description": "Triggered when the same event repeats many times in a short period.",
        "purpose": "Reduces noise by grouping repeated events.",
        "enabled": True,
    },
    {
        "rule_id": "R010",
        "name": "Known Benign Event",
        "severity": "LOW",
        "description": "Triggered when a known harmless event is detected.",
        "purpose": "Helps reduce false positives and unnecessary alerts.",
        "enabled": True,
    },
]


def _db():
    return get_db()


# ── Seed ──────────────────────────────────────────────────────────────────────

async def seed_rules() -> None:
    """Insert rules that don't exist yet. Never overwrites enabled/disabled state."""
    for rule in BETA_RULES:
        existing = await _db().rules.find_one({"rule_id": rule["rule_id"]})
        if not existing:
            await _db().rules.insert_one(dict(rule))
    logger.info("Beta detection rules seeded")


# ── Read ──────────────────────────────────────────────────────────────────────

async def get_rules() -> list[dict]:
    cursor = _db().rules.find({}, {"_id": 0}).sort("rule_id", 1)
    return [doc async for doc in cursor]


async def get_enabled_rule_ids() -> set[str]:
    cursor = _db().rules.find({"enabled": True}, {"rule_id": 1, "_id": 0})
    return {doc["rule_id"] async for doc in cursor}


# ── Toggle ────────────────────────────────────────────────────────────────────

async def toggle_rule(rule_id: str, enabled: bool) -> bool:
    result = await _db().rules.update_one(
        {"rule_id": rule_id},
        {"$set": {"enabled": enabled}},
    )
    return result.matched_count > 0
