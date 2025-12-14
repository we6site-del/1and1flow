from services.supabase_client import supabase
import json

print("Fetching Active Models...")
try:
    resp = supabase.table("ai_models").select("id, name, parameters_schema").eq("is_active", True).execute()
    for model in resp.data:
        print(f"\nModel: {model['name']} ({model['id']})")
        print(f"Schema: {json.dumps(model['parameters_schema'], indent=2)}")
except Exception as e:
    print(f"Error: {e}")
