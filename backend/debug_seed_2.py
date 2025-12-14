import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

model = {
    "name": "GPT-4o Debug Custom",
    "type": "CHAT",
    "provider": "CUSTOM",
    "api_path": "gpt-4o-debug-custom",
    "cost_per_gen": 0,
    "is_active": True,
    "description": "Debug model",
    "parameters_schema": []
}

print("Attempting to insert CHAT model with provider=CUSTOM...")
try:
    response = supabase.table("ai_models").insert(model).execute()
    print("Success:", response.data)
except Exception as e:
    print("Error:", str(e))
