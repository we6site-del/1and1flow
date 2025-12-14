import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv
import time

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

print(f"Connecting to {url}...")

try:
    supabase: Client = create_client(
        url, 
        key, 
        options=ClientOptions(
            postgrest_client_timeout=5,
            storage_client_timeout=5
        )
    )
    
    start = time.time()
    print("Executing query...")
    response = supabase.table("projects").select("count", count="exact").limit(1).execute()
    print(f"Query took {time.time() - start:.2f}s")
    print("Response:", response)

except Exception as e:
    print(f"Error: {e}")
