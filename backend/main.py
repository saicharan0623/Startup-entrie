"""
EntriAlert Backend — FastAPI + MongoDB.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend import store
from backend.models import (
    TelemetryPayload, RawTelemetryPayload, FeedbackPayload,
    RegisterPayload, LoginPayload, UpdateRolePayload, ToggleRulePayload,
    DecisionRecord, DevicePayload,
)


# ── R008 background task ──────────────────────────────────────────────────────

OFFLINE_THRESHOLD_MINUTES = 10   # device considered offline after this
OFFLINE_CHECK_INTERVAL    = 120  # run check every 2 minutes


async def check_offline_endpoints() -> None:
    """
    Background task for R008 — Endpoint Offline.
    Runs every OFFLINE_CHECK_INTERVAL seconds.
    For each known device, if last_seen > OFFLINE_THRESHOLD_MINUTES ago
    and no R008 alert was created in the last 30 minutes, fire a decision.
    """
    while True:
        await asyncio.sleep(OFFLINE_CHECK_INTERVAL)
        try:
            enabled = await rules_store.get_enabled_rule_ids()
            if "R008" not in enabled:
                continue

            devices = await store.get_devices()
            cutoff = datetime.utcnow() - timedelta(minutes=OFFLINE_THRESHOLD_MINUTES)

            for device in devices:
                last_seen_str = device.get("last_seen")
                if not last_seen_str:
                    continue

                try:
                    last_seen = datetime.fromisoformat(last_seen_str)
                except ValueError:
                    continue

                if last_seen >= cutoff:
                    continue  # device is online

                hostname = device.get("hostname", "unknown")

                # Don't re-alert if we already fired R008 for this device recently
                already_alerted = await store.has_recent_r008(hostname, within_minutes=30)
                if already_alerted:
                    continue

                minutes_offline = int((datetime.utcnow() - last_seen).total_seconds() / 60)

                dev = DevicePayload(
                    hostname=hostname,
                    os=device.get("os", "unknown"),
                    user=device.get("user", "unknown"),
                    ip=device.get("ip", "unknown"),
                    mac=device.get("mac", "unknown"),
                )

                decision = DecisionRecord(
                    id=str(uuid.uuid4()),
                    event_id=str(uuid.uuid4()),
                    event_type="ENDPOINT_OFFLINE",
                    severity="MEDIUM",
                    rule_id="R008",
                    title=f"Endpoint offline — {hostname} ({minutes_offline} min ago)",
                    what_happened=f"Device '{hostname}' has not sent any logs for {minutes_offline} minutes. Last seen: {last_seen_str}.",
                    why_it_matters="An offline agent may mean the device was shut down, the agent was killed, or network connectivity was lost.",
                    business_impact="Security events on this device are not being monitored. Threats could go undetected.",
                    recommended_action=f"Check if '{hostname}' is powered on and connected. Verify the agent service is running. Restart agent if needed.",
                    confidence=80,
                    tags=["endpoint", "offline", "R008"],
                    device=dev,
                    created_at=datetime.utcnow(),
                )

                await store.add_decision(decision)
                await ws_manager.broadcast({
                    "type": "decision",
                    "data": decision.model_dump(mode="json"),
                })
                logger.warning("[R008] Endpoint offline: %s (%d min)", hostname, minutes_offline)

        except Exception as exc:
            logger.error("R008 check error: %s", exc)
from backend.ws_manager import ws_manager
from backend.pipeline import process_telemetry
from backend.database import connect_db, close_db
from backend import auth_store
from backend import rules_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("entrialert.backend")

API_KEY = os.getenv("ENTRIALERT_API_KEY", "dev-secret-key")


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await auth_store.seed_admin()
    await rules_store.seed_rules()
    # Start R008 background task
    r008_task = asyncio.create_task(check_offline_endpoints())
    logger.info("EntriAlert backend started — R008 offline checker running")
    yield
    r008_task.cancel()
    await close_db()
    logger.info("EntriAlert backend stopped")


app = FastAPI(title="EntriAlert Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Telemetry ingestion ───────────────────────────────────────────────────────

@app.post("/api/telemetry", dependencies=[Depends(verify_api_key)])
async def ingest_telemetry(payload: TelemetryPayload):
    decisions = await process_telemetry(payload, ws_manager)
    return {"received": len(payload.events), "decisions": len(decisions)}


@app.post("/api/telemetry/raw", dependencies=[Depends(verify_api_key)])
async def ingest_raw_telemetry(payload: RawTelemetryPayload):
    tp = TelemetryPayload(
        agent_version=payload.agent_version,
        device=payload.device,
        events=payload.events,
    )
    decisions = await process_telemetry(tp, ws_manager)
    return {"received": len(payload.events), "decisions": len(decisions)}


# ── REST API ──────────────────────────────────────────────────────────────────

@app.get("/api/decisions/{decision_id}")
async def get_decision(decision_id: str):
    d = await store.get_decision(decision_id)
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return d


@app.get("/api/decisions")
async def get_decisions(limit: int = 50, severity: str | None = None):
    decisions = await store.get_decisions(limit=limit, severity=severity)
    return {"decisions": decisions}


@app.get("/api/events")
async def get_events(limit: int = 100):
    return {"events": await store.get_events(limit=limit)}


@app.get("/api/devices")
async def get_devices():
    return {"devices": await store.get_devices()}


@app.get("/api/compliance")
async def get_compliance():
    return await store.get_compliance_summary()


@app.get("/api/stats")
async def get_stats():
    return await store.get_stats()


@app.post("/api/decisions/{decision_id}/feedback")
async def submit_feedback(decision_id: str, payload: FeedbackPayload):
    ok = await store.set_feedback(decision_id, payload.action, payload.note)
    if not ok:
        raise HTTPException(status_code=404, detail="Decision not found")
    await ws_manager.broadcast({"type": "feedback", "decision_id": decision_id, "action": payload.action})
    return {"ok": True}


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
async def register(payload: RegisterPayload):
    user = await auth_store.register_user(
        payload.name, payload.email, payload.password, payload.organization_name
    )
    if not user:
        raise HTTPException(status_code=409, detail="Email already registered")
    return {"user": user}


@app.post("/api/auth/login")
async def login(payload: LoginPayload):
    user = await auth_store.login_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"user": user}


# ── Users (admin) ─────────────────────────────────────────────────────────────

@app.get("/api/users")
async def list_users():
    users = await auth_store.get_all_users()
    return {"users": users}


@app.patch("/api/users/{user_id}/role")
async def update_role(user_id: str, payload: UpdateRolePayload):
    ok = await auth_store.update_user_role(user_id, payload.role)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@app.delete("/api/users/{user_id}")
async def remove_user(user_id: str):
    ok = await auth_store.delete_user(user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@app.post("/api/users/{user_id}/regenerate-key")
async def regen_key(user_id: str):
    new_key = await auth_store.regenerate_api_key(user_id)
    if not new_key:
        raise HTTPException(status_code=404, detail="User not found")
    return {"api_key": new_key}


# ── Rules ─────────────────────────────────────────────────────────────────────

@app.get("/api/rules")
async def get_rules():
    rules = await rules_store.get_rules()
    return {"rules": rules}


@app.patch("/api/rules/{rule_id}")
async def toggle_rule(rule_id: str, payload: ToggleRulePayload):
    ok = await rules_store.toggle_rule(rule_id, payload.enabled)
    if not ok:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"ok": True}


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
