import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

model = {
    "name": "GPT-4o Debug",
    "type": "CHAT",
    "provider": "OPENAI",
    "api_path": "gpt-4o-debug",
    "cost_per_gen": 0,
    "is_active": True,
    "description": "Debug model",
    "parameters_schema": []
}

print("Attempting to insert CHAT model...")
try:
    response = supabase.table("ai_models").insert(model).execute()
    print("Response:", response)
    if response.data:
        print("Success:", response.data)
    else:
        print("No data returned.")
except Exception as e:
    print("Error occurred:", str(e))
    # Try to print more details
    if hasattr(e, 'message'):
        print("Error message:", e.message)
    if hasattr(e, 'details'):
        print("Error details:", e.details)
