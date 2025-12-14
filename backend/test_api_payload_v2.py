import requests
import json
import os

USER_ID = "98bd3401-d79c-4962-a694-5df1ebfe9e40" 

def test_payload(name, payload):
    print(f"\nTesting {name}...")
    try:
        response = requests.post("http://127.0.0.1:8000/api/generate", json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

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
