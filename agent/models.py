"""Shared data models for the agent."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field
import uuid


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EventType(str, Enum):
    FAILED_LOGIN = "FAILED_LOGIN"
    ADMIN_LOGIN = "ADMIN_LOGIN"
    ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT"
    PROCESS_SUSPICIOUS = "PROCESS_SUSPICIOUS"
    POWERSHELL_EXEC = "POWERSHELL_EXEC"
    UNKNOWN_SCRIPT = "UNKNOWN_SCRIPT"
    OUTBOUND_IP = "OUTBOUND_IP"
    DNS_REQUEST = "DNS_REQUEST"
    SUSPICIOUS_PORT = "SUSPICIOUS_PORT"
    # R004 — audit log disabled (Event ID 1102 / 4719)
    AUDIT_LOG_DISABLED = "AUDIT_LOG_DISABLED"
    # R005 — new local admin created (Event ID 4720 + 4732)
    NEW_ADMIN_CREATED = "NEW_ADMIN_CREATED"
    # R006 — Defender disabled (Event ID 5001 / 7036)
    DEFENDER_DISABLED = "DEFENDER_DISABLED"


class DeviceInfo(BaseModel):
    hostname: str
    os: str
    user: str
    ip: str
    mac: str


class SecurityEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: EventType
    severity: Severity
    source: str                  # which collector produced this
    description: str
    raw: dict[str, Any] = {}     # original data
    device: DeviceInfo | None = None


class Telemetry(BaseModel):
    agent_version: str = "1.0.0"
    device: DeviceInfo
    events: list[SecurityEvent]
    sent_at: datetime = Field(default_factory=datetime.utcnow)
