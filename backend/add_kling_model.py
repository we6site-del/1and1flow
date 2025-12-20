
from services.supabase_client import supabase
import uuid

def add_kling():
    kling_data = {
        "name": "Kling 1.5 Video",
        "type": "VIDEO",
        "provider": "FAL",
        "api_path": "fal-ai/kling-video/v1/standard/text-to-video",
        "cost_per_gen": 10,
        "is_active": True,
        "parameters_schema": [
            {"key": "aspect_ratio", "type": "select", "label": "Aspect Ratio", "options": ["16:9", "9:16", "1:1"], "default": "16:9"},
            {"key": "duration", "type": "select", "label": "Duration", "options": ["5s"], "default": "5s"}
        ],
        "description": "High quality video generation from Kling AI"
    }
    
    try:
        # Check if exists first
        exists = supabase.table("ai_models").select("*").eq("name", "Kling 1.5 Video").execute()
        if exists.data:
            print("Kling already exists.")
            return

        res = supabase.table("ai_models").insert(kling_data).execute()
        print(f"Added Kling: {res.data}")
    except Exception as e:
        print(f"Error adding Kling: {e}")

if __name__ == "__main__":
    add_kling()
