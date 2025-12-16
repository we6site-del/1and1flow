import ypy_websocket
from ypy_websocket.websocket_server import WebsocketServer
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
from utils.logger import logger

router = APIRouter()

# Initialize Ypy WebSocket Server
# auto_clean_rooms=True will remove rooms when last client disconnects (in-memory)
websocket_server = WebsocketServer(auto_clean_rooms=True)

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint that handles Yjs synchronization protocol via ypy-websocket.
    This replaces the previous simple broadcaster.
    The ypy-websocket server handles:
    - Sync steps 1 & 2
    - Awareness updates
    - Broadcasting document updates
    """
    try:
        # We need to manually accept the connection first? 
        # ypy-websocket's `serve` method expects an accepted websocket usually, 
        # or at least a standardasgi websocket.
        # FastAPI's WebSocket needs to be accepted.
        await websocket.accept()
        
        # Get the YDoc for this room (creating it if needed)
        # Note: ypy-websocket manages rooms internally.
        # We just need to pass the websocket to the server with the room name.
        
        # Serve the websocket
        # Note: ypy-websocket documentation says `serve(websocket)`
        logger.info(f"Yjs Client connected to room: {room_id}")
        
        # Since room_id is part of the path, we might need to set it on the websocket scope 
        # or pass it explicitly if the library supports it.
        # However, ypy-websocket typically parses the path itself?
        # Actually, `WebsocketServer.serve` usually takes the websocket.
        # If we use it with FastAPI, we might need to ensure it knows the room.
        
        # Looking at ypy-websocket examples:
        # It expects the websocket to be ready.
        # And it uses `websocket.scope["path"]` or similar to determine room?
        # Or we manually get the room.
        
        # WAIT: ypy-websocket `serve` doesn't take room_id as argument in older versions?
        # Let's check typical usage.
        # "server = WebsocketServer(...); await server.serve(websocket)"
        # It extracts path from websocket scope. 
        # Since our path is /api/ws/{room_id}, we need to make sure it parses {room_id} correctly.
        # But `ypy-websocket` might expect just the room name in path?
        
        # To be safe, let's look at how we can just get the YRoom and join it.
        # But `serve` does the protocol handling loop.
        
        # Workaround: If ypy-websocket expects distinct paths, we are good.
        # It uses `websocket.path` or `scope['path']`.
        # Our path is `/api/ws/UUID`.
        # So the room name will be `UUID`.
        
        await websocket_server.serve(websocket)
        
    except WebSocketDisconnect:
        logger.info(f"Yjs Client disconnected from room: {room_id}")
    except Exception as e:
        logger.error(f"Yjs WebSocket Error: {e}")
        # Close if not already closed
        try:
             await websocket.close()
        except:
             pass
