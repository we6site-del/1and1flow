
from services.supabase_client import supabase
import json

def check_models():
    try:
        response = supabase.table("ai_models").select("*").execute()
        models = response.data
        print(f"Found {len(models)} models.")
        for m in models:
            print(f"- [{m['type']}] {m['name']} (provider={m['provider']}, active={m['is_active']})")
            if "kling" in m['name'].lower() or "kling" in str(m.get('api_path')).lower():
                print(f"  *** KLING FOUND: {m} ***")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_models()
