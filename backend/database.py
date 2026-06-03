"""
MongoDB connection — single Motor client shared across the app.
Set MONGODB_URI in your .env to override the default local connection.
"""
import os
import logging
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

# Load .env from project root before reading env vars
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "entrialert")

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=10000,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
    )
    _db = _client[DB_NAME]
    # Verify connection
    await _client.admin.command("ping")
    logger.info("MongoDB connected — db: %s", DB_NAME)

    # Indexes
    await _db.decisions.create_index("id", unique=True)
    await _db.decisions.create_index("severity")
    await _db.decisions.create_index("created_at")
    await _db.events.create_index("id", unique=True)
    await _db.events.create_index("created_at")
    await _db.devices.create_index("hostname", unique=True)
    logger.info("MongoDB indexes ensured")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialised — call connect_db() first")
    return _db
