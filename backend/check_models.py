from services.supabase_client import supabase
import json

try:
    response = supabase.table("ai_models").select("*").execute()
    print(json.dumps(response.data, indent=2))
except Exception as e:
    print(f"Error: {e}")
