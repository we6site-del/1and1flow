import requests
import os
from dotenv import load_dotenv
import time

load_dotenv()

def test_video_generation():
    # Hardcoded values
    # kling-video (FAL) ID from DB check
    model_id = "f21f95a4-1756-4ea7-937b-0f87658a5d93"
    # kling-video (FAL) ID from DB check
    model_id = "f21f95a4-1756-4ea7-937b-0f87658a5d93"
    model = None 

    user_id = "98bd3401-d79c-4962-a694-5df1ebfe9e40"
    print(f"Using User ID: {user_id}")
    
    # 3. Send request
    payload = {
        "prompt": "A cinematic drone shot of a futuristic city",
        "user_id": user_id,
        "node_id": "test-video-node",
        "project_id": "583b6454-70d1-4420-af43-e0163dc75747",
        "model_id": model_id,
        "model": model, 
        "type": "video",
        "parameters": {
            "aspect_ratio": "16:9",
            "duration": "5s"
        }
    }

    print("Sending video generation request...")
    try:
        response = requests.post("http://localhost:8000/api/generate", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            generation_id = data.get("generation_id")
            print(f"Generation ID: {generation_id}")
            print("Request sent. Check backend logs.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_video_generation()
