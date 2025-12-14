"""
Migration script to import chat models from JSON to database
"""
import json
import sys
import os
from supabase import create_client, Client

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for admin operations

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate_chat_models():
    """Migrate chat models from JSON file to database"""
    
    # Read JSON file
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'chat_models.json')
    
    try:
        with open(json_path, 'r') as f:
            models = json.load(f)
    except FileNotFoundError:
        print(f"Error: {json_path} not found")
        return
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return
    
    print(f"Found {len(models)} chat models to migrate")
    
    # Check for existing models
    existing = supabase.table('ai_models').select('api_path').eq('type', 'CHAT').execute()
    existing_paths = {model['api_path'] for model in existing.data}
    
    print(f"Found {len(existing_paths)} existing CHAT models in database")
    
    # Insert models
    inserted = 0
    skipped = 0
    
    for model in models:
        api_path = model.get('api_path')
        
        if api_path in existing_paths:
            print(f"Skipping {model.get('name')} (already exists)")
            skipped += 1
            continue
        
        # Prepare model data
        model_data = {
            'name': model.get('name'),
            'type': 'CHAT',
            'provider': 'OPENROUTER',
            'api_path': api_path,
            'cost_per_gen': model.get('cost_per_gen', 0),
            'is_active': model.get('is_active', True),
            'description': model.get('description', ''),
            'parameters_schema': None,  # CHAT models don't need parameters schema
            'icon_url': None,
            'is_default': False
        }
        
        try:
            result = supabase.table('ai_models').insert(model_data).execute()
            print(f"✓ Inserted: {model.get('name')}")
            inserted += 1
        except Exception as e:
            print(f"✗ Failed to insert {model.get('name')}: {e}")
    
    print(f"\nMigration complete:")
    print(f"  Inserted: {inserted}")
    print(f"  Skipped: {skipped}")
    print(f"  Total: {len(models)}")

if __name__ == "__main__":
    print("=== Chat Models Migration ===\n")
    migrate_chat_models()
