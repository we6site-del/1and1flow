import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(url, key)

email = "we6site@gmail.com"

print(f"Updating credits for {email}...")

# Check if profile exists
response = supabase.table("profiles").select("*").eq("email", email).execute()

if not response.data:
    print(f"Error: No profile found for email {email}")
    # Try debug_admin just in case
    email = "debug_admin@example.com"
    print(f"Trying {email}...")
    response = supabase.table("profiles").select("*").eq("email", email).execute()
    if not response.data:
        print("No profile found for debug_admin either.")
        exit(1)

user_id = response.data[0]['id']
print(f"Found user {email} with ID {user_id}")

# Update credits
update_response = supabase.table("profiles").update({"credits": 99999}).eq("id", user_id).execute()

if update_response.data:
    print(f"Successfully set credits to 99999 for {email}")
else:
    print("Failed to update credits.")
    print(update_response)
