from services.supabase_client import supabase
import time

print("Testing Supabase connectivity...")
try:
    start = time.time()
    # Execute a simple query
    response = supabase.table("ai_models").select("*").limit(1).execute()
    print(f"Success! Data: {response.data}")
    print(f"Time taken: {time.time() - start:.2f}s")
except Exception as e:
    print(f"Failed: {e}")
