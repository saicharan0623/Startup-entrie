## Repo Structure

```
startup-entrie/
│
├── agent/                      # Python endpoint agent
│   ├── main.py                 # Entry point — runs all collectors
│   ├── config.py               # Settings (API URL, intervals, key)
│   ├── models.py               # Shared data models (SecurityEvent, Telemetry)
│   ├── device_info.py          # Collects hostname, OS, IP, MAC
│   ├── rule_engine.py          # Maps events → decisions (agent-side)
│   ├── sender.py               # HTTP sender with local cache fallback
│   ├── cache.py                # Buffers events when backend is offline
│   └── collectors/
│       ├── log_collector.py    # Windows Security Event Log (4625, 4624, 4740)
│       ├── process_monitor.py  # Flags PowerShell, LOLBins, unknown scripts
│       └── network_monitor.py  # Outbound IPs, suspicious ports
│
├── backend/                    # FastAPI server
│   ├── main.py                 # Routes: /api/telemetry, /api/decisions, /ws
│   ├── models.py               # Pydantic models for API payloads
│   ├── pipeline.py             # Telemetry → rule engine → store → WebSocket
│   ├── store.py                # In-memory store (decisions, events, devices)
│   └── ws_manager.py           # WebSocket broadcast to all UI clients
│
├── entrialert/                 # Next.js frontend
│   ├── app/
│   │   ├── page.tsx            # Home — animated hero + live alert ticker
│   │   ├── features/           # Features page
│   │   ├── how-it-works/       # Agent pipeline diagram
│   │   ├── comparison/         # EntriAlert vs existing tools
│   │   ├── contact/            # Early access form
│   │   └── dashboard/          # Live operator dashboard ← main UI
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DecisionCard.tsx    # Expandable decision with feedback buttons
│   │   │   ├── StatsBar.tsx        # Events / decisions / approved / rejected
│   │   │   ├── SeverityChart.tsx   # Pie chart by severity
│   │   │   └── DeviceList.tsx      # Connected endpoints
│   │   ├── AgentPipeline.tsx   # Animated 6-step pipeline diagram
│   │   ├── AlertTicker.tsx     # Live alert → decision animation
│   │   ├── HeroVisual.tsx      # SVG flow diagram (hero section)
│   │   └── Navbar.tsx / Footer.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts     # Auto-reconnecting WebSocket hook
│   └── lib/
│       └── api.ts              # Fetch helpers for backend REST API
│
├── start_backend.bat           # Double-click to start backend (Windows)
├── start_agent.bat             # Double-click to start agent (Windows)
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Uvicorn, WebSockets, Pydantic |
| Agent | Python 3.11, psutil, pywin32, asyncio, requests |

---

## Prerequisites

Make sure you have these installed:

- **Python 3.11+** — https://python.org
- **Node.js 18+** — https://nodejs.org
- **npm** — comes with Node.js

---

## Setup (First Time Only)

### 1. Clone the repo

```bash
git clone https://github.com/saicharan0623/Startup-entrie.git
cd Startup-entrie
```

### 2. Install Python dependencies

```bash
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings psutil requests python-dotenv python-multipart
```

On Windows, also install:
```bash
pip install pywin32
```

### 3. Install frontend dependencies

```bash
cd entrialert
npm install
cd ..
```

---

## Running the Project

Open **3 terminals** from the project root and run one command in each.

### Terminal 1 — Backend
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Ready when you see: `Application startup complete.`

### Terminal 2 — Frontend
```bash
cd entrialert
npm run dev
```
Ready when you see: `Ready on http://localhost:3000`

### Terminal 3 — Agent
```bash
python -m agent.main
```
> Run as **Administrator** for full Windows Event Log access.  
> Without admin, process and network monitoring still work.

Ready when you see: `Device: <hostname> — <ip>`

---

## Open in Browser

| Page | URL | Description |
|---|---|---|
| Home | http://localhost:3000 | Marketing site |
| Dashboard | http://localhost:3000/dashboard | Live operator view |
| API Docs | http://localhost:8000/docs | FastAPI auto-docs |

---

---

## Configuration

The agent reads config from environment variables or an `.env` file in the project root.

| Variable | Default | Description |
|---|---|---|
| `ENTRIALERT_API_URL` | `http://localhost:8000` | Backend URL |
| `ENTRIALERT_API_KEY` | `dev-secret-key` | Shared secret |
| `ENTRIALERT_LOG_INTERVAL` | `30` | Seconds between log scans |
| `ENTRIALERT_PROCESS_INTERVAL` | `15` | Seconds between process scans |
| `ENTRIALERT_NETWORK_INTERVAL` | `20` | Seconds between network scans |

Create a `.env` file in the root to override:
```
ENTRIALERT_API_URL=http://your-server:8000
ENTRIALERT_API_KEY=your-secret-key
```
