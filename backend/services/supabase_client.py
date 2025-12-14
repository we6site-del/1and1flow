import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    # Fallback for local dev if .env not loaded or vars different
    # But ideally we should fail if not found.
    # For now, let's try SUPABASE_KEY as fallback
    key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY) not found in environment variables")

from supabase import create_client, Client, ClientOptions

supabase: Client = create_client(
    url, 
    key, 
    options=ClientOptions(
        postgrest_client_timeout=10,
        storage_client_timeout=10
    )
)
