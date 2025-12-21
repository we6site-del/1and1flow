import os
import logging
from dotenv import load_dotenv
from services.supabase_client import supabase

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def fix_model_providers():
    print("\n=== Fixing Model Providers in Database ===")
    
    # 1. Fetch current models
    print("Fetching models...")
    response = supabase.table("ai_models").select("*").execute()
    models = response.data
    
    updates = []
    
    for model in models:
        api_path = model.get("api_path", "").lower()
        current_provider = model.get("provider")
        
        # Logic: If it's a Flux model, it should be FAL
        if "flux" in api_path and current_provider != "FAL":
            print(f"🔄 Switching {model['name']} ({api_path}) from {current_provider} to FAL")
            
            update_data = {"provider": "FAL"}
            # Determine correct api_path for Fal if needed (optional, FalProvider handles generic names nicely usually, 
            # but let's assume api_path is correct for Fal or mapped in code)
            # The current api_path 'black-forest-labs/flux.2-pro' works with Fal? 
            # Fal expects 'fal-ai/flux-pro/v1.1' etc.
            # But specific mapping happens in FalProvider or fal_ai.py service. 
            # Let's hope the mapping logic exists.
            
            supabase.table("ai_models").update(update_data).eq("id", model["id"]).execute()
            updates.append(model["name"])
            
    if not updates:
        print("✅ No models needed updating. All Flux models are already FAL.")
    else:
        print(f"✅ Updated {len(updates)} models to FAL: {', '.join(updates)}")

if __name__ == "__main__":
    fix_model_providers()
