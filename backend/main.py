from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import generate, payments, chat, admin, projects, plans

app = FastAPI(title="Lovart-Flow API")

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
