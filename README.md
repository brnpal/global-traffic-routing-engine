# Global Traffic Routing Engine

Live view of lower-level network flows, metro rings, and physical
infrastructure around the world. Drop simulated users onto the network
fabric and watch edge and core routing decisions resolve in real time.

A real-time, full-stack demo: simulated users are placed on a Mapbox globe,
the FastAPI WebSocket backend resolves the nearest edge PoP via great-circle
distance, and the routing decision is streamed back and animated edge→core.

## Architecture

- `api/` — FastAPI + Uvicorn WebSocket server streaming routing decisions
- `web/` — Vite + React 19 + Mapbox GL frontend (react-map-gl, Turf.js, Tailwind)

## Deployment

- **Backend** → [Render](https://render.com) (free web service, WebSocket support)
  via [`render.yaml`](render.yaml). Exposes `wss://<service>.onrender.com/ws`.
- **Frontend** → [Vercel](https://vercel.com) (root directory `web/`, Vite preset)
  via [`web/vercel.json`](web/vercel.json).

The frontend reads two environment variables at build time:

| Variable | Purpose |
| --- | --- |
| `VITE_MAPBOX_TOKEN` | Mapbox public token (`pk.…`) — required for the map to render |
| `VITE_WS_URL` | WebSocket URL of the backend, e.g. `wss://gtre-api.onrender.com/ws`. Falls back to `ws://localhost:8000/ws` for local dev. |

## Running locally

### Backend

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # runs on :8000
```

### Frontend

In a separate terminal:

```bash
cd web
npm install
cp .env.example .env.local   # then fill in VITE_MAPBOX_TOKEN
npm run dev                  # runs on :5173
```

With `VITE_WS_URL` unset, the frontend connects to the local backend at
`ws://localhost:8000/ws`.
