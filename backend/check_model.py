from services.supabase_client import supabase
import sys

mid = "ef79ca40-12fc-4d18-8ccb-26e5298139e8"
print(f"Querying model: {mid}")
try:
    resp = supabase.table("ai_models").select("*").eq("id", mid).execute()
    if resp.data:
        print(f"Model Info: {resp.data[0]}")
    else:
        print("Model not found")
except Exception as e:
    print(f"Error: {e}")
