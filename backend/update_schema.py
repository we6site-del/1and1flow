from services.supabase_client import supabase
import json

# Enhanced schemas with more options
flux_schema = [
  {
    "key": "aspect_ratio",
    "type": "grid_select",
    "label": "Ratio",
    "default": "1:1",
    "options": [
      {"label": "1:1", "value": "1:1"},
      {"label": "16:9", "value": "16:9"},
      {"label": "9:16", "value": "9:16"},
      {"label": "4:3", "value": "4:3"},
      {"label": "3:4", "value": "3:4"},
      {"label": "3:2", "value": "3:2"},
      {"label": "2:3", "value": "2:3"}
    ]
  },
  {
    "key": "num_inference_steps",
    "type": "slider",
    "label": "Steps",
    "default": 28,
    "min": 1,
    "max": 50
  },
  {
    "key": "guidance_scale",
    "type": "slider",
    "label": "Guidance",
    "default": 3.5,
    "min": 1.0,
    "max": 20.0,
    "step": 0.1
  }
]

print("Updating schemas...")
# Update flux.2-pro (ef79ca40-12fc-4d18-8ccb-26e5298139e8)
supabase.table("ai_models").update({"parameters_schema": flux_schema}).eq("id", "ef79ca40-12fc-4d18-8ccb-26e5298139e8").execute()
print("Updated flux.2-pro")

# Update gemini-3-pro (d208fbf9-ea3e-44f9-9973-6a106e511510) and correct ID/Name likely to 'google/gemini-flash-1.5'
# But for now just update schema
supabase.table("ai_models").update({"parameters_schema": flux_schema}).eq("id", "d208fbf9-ea3e-44f9-9973-6a106e511510").execute()
print("Updated gemini-3-pro")
