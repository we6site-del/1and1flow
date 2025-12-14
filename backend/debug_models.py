
import asyncio
from services.supabase_client import supabase

def check_models():
    try:
        response = supabase.table("ai_models").select("*").execute()
        print(f"Total models in DB: {len(response.data)}")
        for model in response.data:
            print(f"- {model['name']} ({model['type']}) Active: {model['is_active']}")
    except Exception as e:
        print(f"Error querying Supabase: {e}")

if __name__ == "__main__":
    check_models()
