from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import db

router = APIRouter(prefix="/api/ws", tags=["Realtime"])

initial_investors = []
initial_founders = []

@router.on_event("startup")
async def load_initial_cache():
    global initial_investors, initial_founders
    initial_investors = db.get_all_investors()
    initial_founders = db.get_all_outbound_signals()

class ConnectionManager:
    def __init__(self):
        self.active_investors: List[WebSocket] = []
        self.active_founders: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        if role == "investor":
            self.active_investors.append(websocket)
        elif role == "founder":
            self.active_founders.append(websocket)

    def disconnect(self, websocket: WebSocket, role: str):
        if role == "investor" and websocket in self.active_investors:
            self.active_investors.remove(websocket)
        elif role == "founder" and websocket in self.active_founders:
            self.active_founders.remove(websocket)

    async def broadcast_to_investors(self, message: dict):
        # Sends real-time internet scraped signals directly to investor radars
        for connection in self.active_investors:
            await connection.send_text(json.dumps(message))

    async def broadcast_to_founders(self, message: dict):
        # Sends real-time investor configuration match changes directly to founder radars
        for connection in self.active_founders:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/{role}")
async def websocket_endpoint(websocket: WebSocket, role: str):
    await manager.connect(websocket, role)
    try:
        # Send cached data immediately upon connection
        if role == "founder":
            await websocket.send_text(json.dumps({"type": "INIT_LIST", "data": initial_investors}))
        else:
            await websocket.send_text(json.dumps({"type": "INIT_LIST", "data": initial_founders}))
            
        while True:
            # Maintain connection loop, ingest inbound client broadcasts
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if role == "founder":
                # Founder broadcasts equity/funding updates live
                await manager.broadcast_to_investors({
                    "type": "FOUNDER_BROADCAST",
                    "data": payload
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, role)
