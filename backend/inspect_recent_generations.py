from services.supabase_client import supabase
import json

def inspect_recent_generations():
    print("Fetching recent generations...")
    try:
        # Fetch last 5 generations
        response = supabase.table("generations")\
            .select("id, project_id, status, result_url, created_at")\
            .order("created_at", desc=True)\
            .limit(5)\
            .execute()
        
        print(json.dumps(response.data, indent=2))
        
        # Check if any have project_id
        count_with_project = supabase.table("generations")\
            .select("count", count="exact")\
            .not_.is_("project_id", "null")\
            .execute()
        
        print(f"\nTotal generations with project_id: {count_with_project.count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_recent_generations()
