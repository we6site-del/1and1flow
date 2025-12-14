from services.supabase_client import supabase
import json

try:
    # Fetch recent generations
    response = supabase.table("generations").select("*").order("created_at", desc=True).limit(5).execute()
    print("Recent Generations:")
    print(json.dumps(response.data, indent=2))

    # Fetch projects
    projects = supabase.table("projects").select("*").limit(5).execute()
    print("\nProjects:")
    print(json.dumps(projects.data, indent=2))

except Exception as e:
    print(f"Error: {e}")
