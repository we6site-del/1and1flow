
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
print("Checking Supabase connection...")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Supabase credentials missing from .env")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    # Try to select 1 row
    print("Querying curated_prompts...")
    res = supabase.table("curated_prompts").select("id").limit(1).execute()
    print("Table exists!")
    print(res)
except Exception as e:
    print(f"Table check failed (likely missing): {e}")
