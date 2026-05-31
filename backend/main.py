"""
EntriAlert Backend — FastAPI server.
Receives telemetry from agents, runs the rule engine,
broadcasts decisions over WebSocket, and serves a REST API for the UI.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend.store import store
from backend.models import TelemetryPayload, RawTelemetryPayload, FeedbackPayload
from backend.ws_manager import ws_manager
from backend.pipeline import process_telemetry

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("entrialert.backend")

API_KEY = os.getenv("ENTRIALERT_API_KEY", "dev-secret-key")


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("EntriAlert backend started")
    yield
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
    decisions = await process_telemetry(payload, store, ws_manager)
    return {"received": len(payload.events), "decisions": len(decisions)}


@app.post("/api/telemetry/raw", dependencies=[Depends(verify_api_key)])
async def ingest_raw_telemetry(payload: RawTelemetryPayload):
    """Accepts cached/replayed events from the agent."""
    tp = TelemetryPayload(
        agent_version=payload.agent_version,
        device=payload.device,
        events=payload.events,
    )
    decisions = await process_telemetry(tp, store, ws_manager)
    return {"received": len(payload.events), "decisions": len(decisions)}


# ── REST API for UI ───────────────────────────────────────────────────────────

@app.get("/api/decisions")
async def get_decisions(limit: int = 50, severity: str | None = None):
    decisions = store.get_decisions(limit=limit, severity=severity)
    return {"decisions": decisions}


@app.get("/api/events")
async def get_events(limit: int = 100):
    return {"events": store.get_events(limit=limit)}


@app.get("/api/devices")
async def get_devices():
    return {"devices": store.get_devices()}


@app.get("/api/stats")
async def get_stats():
    return store.get_stats()


@app.post("/api/decisions/{decision_id}/feedback")
async def submit_feedback(decision_id: str, payload: FeedbackPayload):
    ok = store.set_feedback(decision_id, payload.action, payload.note)
    if not ok:
        raise HTTPException(status_code=404, detail="Decision not found")
    await ws_manager.broadcast({"type": "feedback", "decision_id": decision_id, "action": payload.action})
    return {"ok": True}


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/health")
async def health():
    return {"status": "ok"}
