import requests
import json
import os

# You might need to set a valid user_id here if your DB requires it
USER_ID = "98bd3401-d79c-4962-a694-5df1ebfe9e40" 

def test_payload(name, payload):
    print(f"\nTesting {name}...")
    try:
        response = requests.post("http://localhost:8000/api/generate", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# 1. Test with empty parameters
payload_empty = {
    "prompt": "Test prompt empty params",
    "user_id": USER_ID,
    "node_id": "test-node-1",
    "type": "image",
    "model": "flux-pro",
    "parameters": {}
}

# 2. Test with None parameters
payload_none = {
    "prompt": "Test prompt none params",
    "user_id": USER_ID,
    "node_id": "test-node-2",
    "type": "image",
    "model": "flux-pro",
    "parameters": None
}

# 3. Test with valid parameters
payload_valid = {
    "prompt": "Test prompt valid params",
    "user_id": USER_ID,
    "node_id": "test-node-3",
    "type": "image",
    "model": "flux-pro",
    "parameters": {"safety_tolerance": "2"}
}

# 4. Test Video
payload_video = {
    "prompt": "Test video prompt",
    "user_id": USER_ID,
    "node_id": "test-node-4",
    "type": "video",
    "model": "kling-pro",
    "parameters": {"duration": "5s"}
}

# 5. Test Flux-2 (FAL) from DB
payload_flux2 = {
    "prompt": "Test flux-2 prompt",
    "user_id": USER_ID,
    "node_id": "test-node-flux2",
    "type": "image",
    "model_id": "7acede12-6b91-4e1a-9b6a-850e41e7a381", # flux-2
    "parameters": {"aspect_ratio": "1:1"}
}

# 6. Test Kling 2.1 (Replicate) from DB
payload_kling2 = {
    "prompt": "Test kling 2.1 prompt",
    "user_id": USER_ID,
    "node_id": "test-node-kling2",
    "type": "video",
    "model_id": "f748456b-9d7d-47af-95d6-de5f4e85267f", # Kling 2.1 Master
    "parameters": {"duration": "5s", "aspect_ratio": "16:9"}
}

if __name__ == "__main__":
    test_payload("Flux-2 (FAL)", payload_flux2)
    test_payload("Kling 2.1 (Replicate)", payload_kling2)
