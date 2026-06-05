"""
Auth store — user registration, login, and management via MongoDB.
"""
from __future__ import annotations
import hashlib
import os
import uuid
import logging
from datetime import datetime
from backend.database import get_db

logger = logging.getLogger(__name__)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@entrialert.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_NAME = os.getenv("ADMIN_NAME", "EntriAlert Admin")
ADMIN_ORG = os.getenv("ADMIN_ORG", "EntriAlert")


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


def _db():
    return get_db()


# ── Seed admin ────────────────────────────────────────────────────────────────

async def seed_admin() -> None:
    """Create admin account on startup if it doesn't exist."""
    existing = await _db().users.find_one({"email": ADMIN_EMAIL})
    if existing:
        return
    doc = {
        "id": str(uuid.uuid4()),
        "name": ADMIN_NAME,
        "email": ADMIN_EMAIL,
        "password_hash": _hash(ADMIN_PASSWORD),
        "organization_name": ADMIN_ORG,
        "organization_id": "ORG-ADMIN-001",
        "role": "admin",
        "api_key": "dev-secret-key",
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
    }
    await _db().users.insert_one(doc)
    logger.info("Admin account seeded: %s", ADMIN_EMAIL)


# ── Register ──────────────────────────────────────────────────────────────────

async def register_user(name: str, email: str, password: str, organization_name: str) -> dict | None:
    """Returns user dict on success, None if email already exists."""
    existing = await _db().users.find_one({"email": email})
    if existing:
        return None

    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password_hash": _hash(password),
        "organization_name": organization_name,
        "organization_id": f"ORG-{str(uuid.uuid4())[:8].upper()}",
        "role": "viewer",
        "api_key": str(uuid.uuid4()).replace("-", ""),
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None,
    }
    await _db().users.insert_one(doc)
    logger.info("User registered: %s", email)
    return _clean(dict(doc))


# ── Login ─────────────────────────────────────────────────────────────────────

async def login_user(email: str, password: str) -> dict | None:
    """Returns user dict on success, None if credentials invalid."""
    doc = await _db().users.find_one({"email": email})
    if not doc:
        return None
    if doc.get("password_hash") != _hash(password):
        return None

    # Update last_login
    now = datetime.utcnow().isoformat()
    await _db().users.update_one({"email": email}, {"$set": {"last_login": now}})
    doc["last_login"] = now
    return _clean(dict(doc))


# ── List users ────────────────────────────────────────────────────────────────

async def get_all_users() -> list[dict]:
    cursor = _db().users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1)
    return [doc async for doc in cursor]


# ── Update role ───────────────────────────────────────────────────────────────

async def update_user_role(user_id: str, role: str) -> bool:
    result = await _db().users.update_one({"id": user_id}, {"$set": {"role": role}})
    return result.matched_count > 0


# ── Delete user ───────────────────────────────────────────────────────────────

async def delete_user(user_id: str) -> bool:
    result = await _db().users.delete_one({"id": user_id})
    return result.deleted_count > 0


# ── Regenerate API key ────────────────────────────────────────────────────────

async def regenerate_api_key(user_id: str) -> str | None:
    new_key = str(uuid.uuid4()).replace("-", "")
    result = await _db().users.update_one({"id": user_id}, {"$set": {"api_key": new_key}})
    if result.matched_count > 0:
        return new_key
    return None


# ── Get single user ───────────────────────────────────────────────────────────

async def get_user_by_id(user_id: str) -> dict | None:
    doc = await _db().users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return doc
