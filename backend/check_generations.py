import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

print("Checking RLS policies for 'generations' table...")
# We can't directly query pg_policies via supabase-py easily without rpc, 
# but we can try to insert/select as a user to test permissions if we had a user token.
# Instead, let's just check if we can read the table structure or if there are any obvious issues.

# Actually, the best way to check if Realtime is enabled is to check the publication.
# But we can't do that easily from client.

# Let's check if we can fetch generations as the specific user.
user_id = "98bd3401-d79c-4962-a694-5df1ebfe9e40" # The user we used for testing

print(f"Fetching generations for user {user_id}...")
response = supabase.table("generations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(5).execute()

if response.data:
    print(f"Found {len(response.data)} generations.")
    print("Sample:", response.data[0])
else:
    print("No generations found or access denied (though service key should bypass RLS).")

print("\nTo truly debug RLS, we need to check the SQL policies.")
