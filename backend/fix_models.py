from services.supabase_client import supabase

def fix_models():
    print("Fixing model types in ai_models table...")
    
    # 1. search for kling-video and set type to VIDEO
    try:
        response = supabase.table("ai_models").select("*").ilike("name", "%kling%").execute()
        for model in response.data:
            if "video" in model["api_path"] or "video" in model["name"].lower():
                if model["type"] != "VIDEO":
                    print(f"Updating {model['name']} (ID: {model['id']}) to VIDEO...")
                    supabase.table("ai_models").update({"type": "VIDEO"}).eq("id", model["id"]).execute()
                else:
                    print(f"{model['name']} is already VIDEO.")
                    
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_models()
