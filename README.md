# Global Traffic Routing Engine

Live view of lower-level network flows, metro rings, and physical
infrastructure around the world. Drop simulated users onto the network
fabric and watch edge and core routing decisions resolve in real time.

Simulated users are placed on a Mapbox globe; the app resolves the nearest
edge PoP by great-circle distance and animates the user→edge→core path.
**Routing runs entirely client-side**, so the demo deploys as a static site
with no backend or server dependency — it works instantly for every visitor.

## Architecture

- `web/` — Vite + React 19 + Mapbox GL frontend (react-map-gl, Turf.js,
  Tailwind). Computes routing in the browser (`resolveRoute` in `src/App.tsx`).
- `api/` — **Optional.** The original FastAPI + Uvicorn WebSocket server that
  performed the routing decision server-side. Preserved as a reference
  implementation; the deployed frontend no longer depends on it.

## Deployment

- **Frontend** → [Vercel](https://vercel.com) (root directory `web/`, Vite
  preset) via [`web/vercel.json`](web/vercel.json). The only required env var
  is `VITE_MAPBOX_TOKEN` (a Mapbox public `pk.…` token).
- `render.yaml` is kept for anyone who wants to also run the optional backend
  on [Render](https://render.com), but it is not needed to run the demo.

## Running locally

```bash
cd web
npm install
cp .env.example .env.local   # then fill in VITE_MAPBOX_TOKEN
npm run dev                  # runs on :5173 — no backend required
```

### Optional: run the original FastAPI backend

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # runs on :8000
```
