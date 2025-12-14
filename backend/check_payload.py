
import json
import os

try:
    with open('backend/debug_payload.json', 'r') as f:
        data = json.load(f)
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error reading payload: {e}")
