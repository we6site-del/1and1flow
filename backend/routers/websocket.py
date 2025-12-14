import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import time

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Store active connections: room_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        print(f"Client connected to room {room_id}. Total: {len(self.active_connections[room_id])}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        print(f"Client disconnected from room {room_id}")

    async def broadcast(self, message: str | bytes, room_id: str, sender: WebSocket):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != sender:
                    try:
                        if isinstance(message, str):
                            await connection.send_text(message)
                        else:
                            await connection.send_bytes(message)
                    except Exception as e:
                        print(f"Error broadcasting: {e}")

manager = ConnectionManager()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            # We accept both text and bytes
            # Tldraw/Yjs might send binary updates
            message = await websocket.receive()
            
            if "text" in message:
                await manager.broadcast(message["text"], room_id, websocket)
            elif "bytes" in message:
                await manager.broadcast(message["bytes"], room_id, websocket)
                
            # Optional: Persist data to Supabase periodically here
            # But simple broadcast is enough for real-time collaboration session

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, room_id)
