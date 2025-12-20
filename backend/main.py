from dotenv import load_dotenv
load_dotenv()

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import generate, payments, chat, admin, projects, plans

from contextlib import asynccontextmanager
from routers.websocket import websocket_server
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the Yjs WebSocket Server background task
    ws_task = asyncio.create_task(websocket_server.start())
    yield
    # Shutdown logic
    # websocket_server.stop() or cancel task if needed.
    # usually auto_clean_rooms handles things, but we can explicit stop if API supports it.
    # ypy-websocket <=0.12 might not have graceful stop method widely used, 
    # but cancelling the task is standard.
    ws_task.cancel()
    try:
        await ws_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Lovart-Flow API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(plans.router, prefix="/api")

from routers import settings
app.include_router(settings.router, prefix="/api")

from routers import prompts
app.include_router(prompts.router, prefix="/api")

from routers import websocket
app.include_router(websocket.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Lovart-Flow API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
