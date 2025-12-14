from services.supabase_client import supabase
import uuid

def add_fal_models():
    models = [
        {
            "name": "Flux Pro 1.1",
            "type": "IMAGE",
            "provider": "FAL",
            "api_path": "fal-ai/flux-pro/v1.1",
            "cost_per_gen": 4,
            "is_active": True,
            "description": "State-of-the-art image generation model by Black Forest Labs.",
            "icon_url": "https://fal.media/files/penguin/flux-pro-v1.1.png", # Placeholder or real
            "parameters_schema": [
                {
                    "key": "aspect_ratio",
                    "label": "Ratio",
                    "type": "grid_select",
                    "default": "1:1",
                    "options": [
                        {"label": "1:1", "value": "1:1", "desc": "Square"},
                        {"label": "16:9", "value": "16:9", "desc": "Landscape"},
                        {"label": "9:16", "value": "9:16", "desc": "Portrait"},
                        {"label": "4:3", "value": "4:3", "desc": "Standard"},
                        {"label": "3:4", "value": "3:4", "desc": "Vertical"}
                    ]
                },
                {
                    "key": "safety_tolerance",
                    "label": "Safety",
                    "type": "select",
                    "default": "2",
                    "options": [
                        {"label": "Strict", "value": "1"},
                        {"label": "Moderate", "value": "2"},
                        {"label": "Permissive", "value": "3"}
                    ]
                }
            ]
        },
        {
            "name": "Flux Dev",
            "type": "IMAGE",
            "provider": "FAL",
            "api_path": "fal-ai/flux/dev",
            "cost_per_gen": 2,
            "is_active": True,
            "description": "Open-weights version of Flux, great for editing and development.",
            "parameters_schema": [
                {
                    "key": "aspect_ratio",
                    "label": "Ratio",
                    "type": "grid_select",
                    "default": "1:1",
                    "options": [
                        {"label": "1:1", "value": "1:1"},
                        {"label": "16:9", "value": "16:9"},
                        {"label": "9:16", "value": "9:16"}
                    ]
                },
                {
                    "key": "strength",
                    "label": "Strength",
                    "type": "slider",
                    "default": 0.75,
                    "min": 0.1,
                    "max": 1.0,
                    "step": 0.05
                }
            ]
        },
        {
            "name": "Flux Schnell",
            "type": "IMAGE",
            "provider": "FAL",
            "api_path": "fal-ai/flux/schnell",
            "cost_per_gen": 1,
            "is_active": True,
            "description": "Fastest version of Flux (Nano/Speed).",
            "parameters_schema": [
                {
                    "key": "aspect_ratio",
                    "label": "Ratio",
                    "type": "grid_select",
                    "default": "1:1",
                    "options": [
                        {"label": "1:1", "value": "1:1"},
                        {"label": "16:9", "value": "16:9"},
                        {"label": "9:16", "value": "9:16"}
                    ]
                }
            ]
        },
        {
            "name": "Nano Banana Pro",
            "type": "IMAGE",
            "provider": "FAL",
            "api_path": "fal-ai/nano-banana-pro/edit",
            "cost_per_gen": 2,
            "is_active": True,
            "description": "Specialized model for editing.",
            "parameters_schema": [
                 {
                    "key": "strength",
                    "label": "Strength",
                    "type": "slider",
                    "default": 0.75,
                    "min": 0.1,
                    "max": 1.0,
                    "step": 0.05
                }
            ]
        }
    ]

    print("Upserting Fal.ai models...")
    for model in models:
        # Check if exists by api_path
        existing = supabase.table("ai_models").select("id").eq("api_path", model["api_path"]).execute()
        
        if existing.data and len(existing.data) > 0:
            print(f"Updating {model['name']}...")
            supabase.table("ai_models").update(model).eq("id", existing.data[0]['id']).execute()
        else:
            print(f"Creating {model['name']}...")
            supabase.table("ai_models").insert(model).execute()

    print("Done.")

if __name__ == "__main__":
    add_fal_models()
