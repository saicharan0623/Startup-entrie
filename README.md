# EntriAlert — Full Stack

## Structure

```
entrialert/     Next.js frontend (UI + Dashboard)
backend/        FastAPI backend (API + WebSocket + Rule Engine)
agent/          Python agent (runs on Windows endpoints)
```

## Quick Start

### 1. Backend
```bash
# From project root
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
# or double-click start_backend.bat
```

### 2. Frontend
```bash
cd entrialert
npm run dev
# Open http://localhost:3000
# Dashboard at http://localhost:3000/dashboard
```

### 3. Agent (on each endpoint)
```bash
# From project root
python -m agent.main
# or double-click start_agent.bat
```

## Configuration

Agent config via environment variables (prefix `ENTRIALERT_`):
- `ENTRIALERT_API_URL` — backend URL (default: `http://localhost:8000`)
- `ENTRIALERT_API_KEY` — shared secret (default: `dev-secret-key`)
- `ENTRIALERT_LOG_INTERVAL` — seconds between log collection (default: 30)
- `ENTRIALERT_PROCESS_INTERVAL` — seconds between process scans (default: 15)
- `ENTRIALERT_NETWORK_INTERVAL` — seconds between network scans (default: 20)

Or create `agent/.env` with the same keys.

## How It Works

```
Agent (endpoint)
  ├── Log Collector     → Windows Security Event Log (4625, 4624, 4740)
  ├── Process Monitor   → psutil — flags PowerShell, LOLBins, scripts
  └── Network Monitor   → psutil — outbound IPs, suspicious ports

        ↓ HTTP POST /api/telemetry

Backend (FastAPI)
  ├── Rule Engine       → maps event types → decisions with confidence
  ├── In-Memory Store   → holds decisions, events, devices
  └── WebSocket /ws     → broadcasts decisions to UI in real time

        ↓ WebSocket + REST API

Frontend (Next.js)
  └── /dashboard        → live decision feed, severity chart, device list
```
