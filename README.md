# Global Traffic Routing Engine

> [!NOTE]
> **This project has moved.** It now lives as a live, in-browser demo at
> **[brendanallaway.me/global-traffic-routing-engine/](https://brendanallaway.me/global-traffic-routing-engine/)**.
>
> This repository is archived and kept read-only as a source-code reference.
> The active implementation is maintained in the
> [portfolio repo](https://github.com/brnpal/portfolio/tree/main/global-traffic-routing-engine),
> where the FastAPI WebSocket backend has been replaced with a pure client-side
> simulation loop so the whole thing runs as static HTML/CSS/JS with no server.
>
> This archived version is the original dual-component architecture
> (FastAPI backend + Vite/React frontend with Mapbox) preserved for reference.

## About

Live view of lower-level network flows, metro rings, and physical
infrastructure around the world. Drop simulated users onto the network
fabric and watch edge and core routing decisions resolve in real time.

**Architecture (this archived version):**
- `api/` — FastAPI + Uvicorn WebSocket server streaming routing decisions
- `web/` — Vite + React + Mapbox frontend

## Running locally

### Backend

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install fastapi uvicorn websockets
uvicorn main:app --reload   # runs on :8000
```

### Frontend

In a separate terminal:

```bash
cd web
npm install
echo "VITE_MAPBOX_TOKEN=your_mapbox_token_here" > .env.local
npm run dev                 # runs on :5173
```

Open the Vite URL and the frontend will connect to the backend via
`ws://localhost:8000/ws`.
