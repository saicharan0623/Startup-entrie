"""Backend-specific Pydantic models."""
from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
import uuid


# ── Auth models ───────────────────────────────────────────────────────────────

class RegisterPayload(BaseModel):
    name: str
    email: str
    password: str
    organization_name: str


class LoginPayload(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    organization_name: str
    organization_id: str
    role: str          # "admin" | "viewer"
    api_key: str
    created_at: str
    last_login: str | None = None


class UpdateRolePayload(BaseModel):
    role: str          # "admin" | "viewer"


class ToggleRulePayload(BaseModel):
    enabled: bool


class DevicePayload(BaseModel):
    hostname: str
    os: str
    user: str
    ip: str
    mac: str


class EventPayload(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str
    severity: str
    source: str
    description: str
    raw: dict[str, Any] = {}
    device: DevicePayload | None = None


class TelemetryPayload(BaseModel):
    agent_version: str = "1.0.0"
    device: DevicePayload
    events: list[EventPayload]
    sent_at: datetime = Field(default_factory=datetime.utcnow)


class RawTelemetryPayload(BaseModel):
    agent_version: str = "1.0.0"
    device: DevicePayload
    events: list[dict[str, Any]]


class FeedbackPayload(BaseModel):
    action: str   # "approve" | "reject" | "incorrect"
    note: str = ""


class DecisionRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    event_type: str
    severity: str
    title: str
    what_happened: str
    why_it_matters: str
    business_impact: str
    recommended_action: str
    confidence: int
    rule_id: str = ""           # R001–R010
    tags: list[str] = []
    device: DevicePayload | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    feedback: str | None = None   # approve / reject / incorrect
    feedback_note: str = ""
