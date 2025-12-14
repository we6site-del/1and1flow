import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(url, key)

response = supabase.table("ai_models").select("*").eq("is_active", True).execute()

print(f"Found {len(response.data)} active models:")
for model in response.data:
    print(f"- {model['name']} ({model['type']})")
    print(f"  Provider: {model['provider']}")
    print(f"  API Path: {model['api_path']}")
    print(f"  ID: {model['id']}")
    print("-" * 20)
