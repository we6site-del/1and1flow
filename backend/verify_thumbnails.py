from routers.projects import get_projects
from services.supabase_client import supabase
import json

def verify_thumbnails():
    print("Verifying get_projects thumbnail logic...")
    try:
        # Get a user ID who actually has projects
        # First get a project, then get its user_id
        proj_response = supabase.table("projects").select("user_id").limit(1).execute()
        if not proj_response.data:
            print("No projects found in DB.")
            return
            
        user_id = proj_response.data[0]["user_id"]
        print(f"Testing for user_id: {user_id}")
        
        projects = get_projects(user_id=user_id)
        
        print(f"Found {len(projects)} projects.")
        
        thumbnails_found = 0
        for p in projects:
            if p.get("thumbnail_url"):
                thumbnails_found += 1
                print(f"Project {p['id']} has thumbnail: {p['thumbnail_url'][:50]}...")
            else:
                print(f"Project {p['id']} has NO thumbnail.")
                # Debug: Print canvas data for the first failed project
                if thumbnails_found == 0:
                    # Fetch raw canvas data to inspect
                    raw_proj = supabase.table("projects").select("canvas_data").eq("id", p['id']).single().execute()
                    print(f"DEBUG: Canvas Data for {p['id']}:")
                    print(json.dumps(raw_proj.data, indent=2)[:1000]) # Print first 1000 chars
                
        print(f"\nTotal projects with thumbnails: {thumbnails_found}/{len(projects)}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_thumbnails()
