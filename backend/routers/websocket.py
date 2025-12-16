import ypy_websocket
from ypy_websocket.websocket_server import WebsocketServer
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
from utils.logger import logger

router = APIRouter()

# Initialize Ypy WebSocket Server
# auto_clean_rooms=True will remove rooms when last client disconnects (in-memory)
websocket_server = WebsocketServer(auto_clean_rooms=True)

# Adapter to bridge FastAPI WebSocket with ypy-websocket expectations
class FastAPIWebsocketAdapter:
    def __init__(self, websocket: WebSocket):
        self._ws = websocket
        logger.info(f"DEBUG: Adapter init. Path: {self.path}")

    @property
    def path(self) -> str:
        return self._ws.scope["path"]

    @property
    def query_params(self):
        return self._ws.query_params

    async def send(self, message):
        # logger.info(f"DEBUG: Adapter send type={type(message)}")
        if isinstance(message, bytes):
            # logger.info(f"DEBUG: Adapter sending bytes len={len(message)}")
            await self._ws.send_bytes(message)
        elif isinstance(message, str):
            # logger.info(f"DEBUG: Adapter sending str len={len(message)}")
            await self._ws.send_text(message)

    async def recv(self):
        try:
            message = await self._ws.receive()
            # logger.info(f"DEBUG: Adapter receive raw msg keys={message.keys() if isinstance(message, dict) else '?'}")
        except Exception as e:
            logger.error(f"DEBUG: Adapter receive error: {e}")
            raise e

        if "bytes" in message:
            return message["bytes"]
        elif "text" in message:
            return message["text"]
        elif message.get("type") == "websocket.disconnect":
            logger.info("DEBUG: Adapter received websocket.disconnect")
            # Returning empty bytes signals EOF to ypy-websocket usually
            return b""
            
        logger.warning(f"DEBUG: Adapter received unknown message type: {message}")
        return b""

    async def close(self):
        logger.info("DEBUG: Adapter executing close()")
        await self._ws.close()

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
        
        # Wrap the FastAPI websocket to match ypy-websocket interface
        socket_adapter = FastAPIWebsocketAdapter(websocket)
        logger.info(f"Yjs Client connected to room: {room_id}")
        
        await websocket_server.serve(socket_adapter)
        
    except WebSocketDisconnect:
        logger.info(f"Yjs Client disconnected from room: {room_id}")
    except Exception as e:
        import traceback
        logger.error(f"Yjs WebSocket Error: {e}\n{traceback.format_exc()}")
        # Close if not already closed
        try:
             await websocket.close()
        except:
             pass
