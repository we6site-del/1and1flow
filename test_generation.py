#!/usr/bin/env python3
import requests
import json

# Test generation endpoint
url = "http://localhost:8000/api/generate"
payload = {
    "prompt": "a beautiful sunset over mountains",
    "user_id": "test-user-123",
    "node_id": "test-node-456",
    "project_id": "test-project-789",
    "model_id": "ef79ca40-12fc-4d18-8ccb-26e5298139e8",  # Flux Pro
    "type": "image",
    "parameters": {"aspect_ratio": "16:9"},
    "num_images": 1
}

print("Testing /api/generate endpoint...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Success! Generation ID: {data.get('generation_id')}")
        print(f"Status: {data.get('status')}")
    else:
        print(f"\n❌ Failed with status {response.status_code}")
except Exception as e:
    print(f"\n❌ Error: {e}")
