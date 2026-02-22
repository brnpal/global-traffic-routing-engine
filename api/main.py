from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import math
import uuid
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

@app.get("/")
def read_root():
    return {"message": "Geo-DNS Router API"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "SIMULATE_TRAFFIC":
                nodes = payload.get("nodes", [])
                user = payload.get("user")
                
                if not nodes or not user:
                    continue
                    
                # Find closest node
                closest_node = None
                min_distance = float('inf')
                
                for node in nodes:
                    dist = haversine(user["lat"], user["lng"], node["lat"], node["lng"])
                    if dist < min_distance:
                        min_distance = dist
                        closest_node = node
                
                if closest_node:
                    await manager.broadcast({
                        "type": "ROUTING_DECISION",
                        "user": user,
                        "node": closest_node,
                        "distance_km": round(min_distance, 2)
                    })
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
