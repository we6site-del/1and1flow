import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

chat_models = [
    {
        "name": "GPT-4o",
        "type": "CHAT",
        "provider": "OPENAI",
        "api_path": "gpt-4o",
        "cost_per_gen": 0,
        "is_active": True,
        "description": "Most advanced model",
        "parameters_schema": []
    },
    {
        "name": "GPT-4 Turbo",
        "type": "CHAT",
        "provider": "OPENAI",
        "api_path": "gpt-4-turbo",
        "cost_per_gen": 0,
        "is_active": True,
        "description": "High intelligence, updated knowledge",
        "parameters_schema": []
    },
    {
        "name": "GPT-3.5 Turbo",
        "type": "CHAT",
        "provider": "OPENAI",
        "api_path": "gpt-3.5-turbo",
        "cost_per_gen": 0,
        "is_active": True,
        "description": "Fast and efficient",
        "parameters_schema": []
    }
]

print("Seeding chat models...")
for model in chat_models:
    # Check if exists
    existing = supabase.table("ai_models").select("id").eq("api_path", model["api_path"]).eq("type", "CHAT").execute()
    if not existing.data:
        print(f"Adding {model['name']}...")
        supabase.table("ai_models").insert(model).execute()
    else:
        print(f"Skipping {model['name']} (already exists)")

print("Done!")
