from services.supabase_client import supabase
import json

def inspect_canvas_data():
    try:
        # Fetch one project with canvas_data
        response = supabase.table("projects").select("id, name, canvas_data").neq("canvas_data", {}).limit(1).execute()
        
        if response.data:
            project = response.data[0]
            print(f"Project: {project['name']} ({project['id']})")
            canvas_data = project['canvas_data']
            
            # Print keys of canvas_data
            if isinstance(canvas_data, dict):
                print("Top level keys:", canvas_data.keys())
                if "store" in canvas_data:
                    print("Store keys sample:", list(canvas_data["store"].keys())[:5])
                    records = canvas_data["store"]
                elif "document" in canvas_data:
                    print("Document keys:", canvas_data["document"].keys())
                    if "store" in canvas_data["document"]:
                        print("Store found in document.")
                        records = canvas_data["document"]["store"]
                    else:
                        print("No store in document.")
                        records = {}
                else:
                    print("No 'store' key found.")
                    records = {}

                # Check for assets
                found_asset = False
                if isinstance(records, dict):
                    for key, record in records.items():
                        if record.get("typeName") == "asset":
                            print("\nFound Asset Record:")
                            print(json.dumps(record, indent=2))
                            found_asset = True
                            break
                if not found_asset:
                    print("No asset records found in store.")
            else:
                print("canvas_data is not a dict:", type(canvas_data))
        else:
            print("No projects with canvas_data found.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_canvas_data()
