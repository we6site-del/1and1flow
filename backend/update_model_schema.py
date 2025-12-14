from services.supabase_client import supabase
import json

def update_model_schema():
    print("Updating parameters_schema for kling-video model...")
    
    # 1. Fetch the model
    # kling-video (FAL) ID: f21f95a4-1756-4ea7-937b-0f87658a5d93
    model_id = "f21f95a4-1756-4ea7-937b-0f87658a5d93"
    
    response = supabase.table("ai_models").select("*").eq("id", model_id).execute()
    if not response.data:
        print("Model not found!")
        return

    model = response.data[0]
    schema = model.get("parameters_schema", [])
    
    # 2. Modify the schema
    # Find 'duration' parameter
    updated = False
    for param in schema:
        if param["key"] == "duration":
            print(f"Current duration options: {param['options']}")
            param["options"] = [
                {"label": "5s", "value": "5s"},
                {"label": "10s", "value": "10s"}
            ]
            param["default"] = "5s"
            updated = True
            print("Updated duration options to 5s, 10s.")
            
    if updated:
        # 3. Save back to DB
        supabase.table("ai_models").update({"parameters_schema": schema}).eq("id", model_id).execute()
        print("Successfully updated database.")
    else:
        print("Duration parameter not found in schema.")

if __name__ == "__main__":
    update_model_schema()
