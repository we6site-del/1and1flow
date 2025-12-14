import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

print("Checking 'ai_models' table...")

try:
    response = supabase.table("ai_models").select("*").execute()
    
    if response.data:
        print(f"Found {len(response.data)} models.")
        if len(response.data) > 0:
            print("Columns:", response.data[0].keys())
        for model in response.data:
            print(f"- {model['name']} (ID: {model['id']}, Type: {model['type']}, Provider: {model.get('provider')}, API: {model.get('api_path')}, Active: {model['is_active']}")
            print(f"  Schema: {model.get('parameters_schema')}")
    else:
        print("No models found in 'ai_models' table.")

except Exception as e:
    print(f"Error fetching models: {e}")
