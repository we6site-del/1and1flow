import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

print("Fetching last 5 generations...")
try:
    response = supabase.table("generations").select("*").order("created_at", desc=True).limit(5).execute()
    generations = response.data
    for gen in generations:
        print(f"ID: {gen['id']}")
        print(f"  Status: {gen['status']}")
        print(f"  Created: {gen['created_at']}")
        print(f"  Node ID: {gen['node_id']}")
        print(f"  Result URL: {gen['result_url']}")
        print("-" * 20)
except Exception as e:
    print(f"Error: {e}")
