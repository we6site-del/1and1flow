import requests
import uuid

BASE_URL = "http://localhost:8000"
TEST_IMAGE_URL = "https://picsum.photos/200/300"
USER_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e" # Admin ID

def verify_upscale_resolutions():
    print("--- Verifying Upscale Resolutions ---")
    
    scales = [2, 4] # Skip 8 for speed/cost if 4 works
    
    for scale in scales:
        print(f"\nTesting Scale {scale}x...")
        payload = {
            "image_url": TEST_IMAGE_URL,
            "user_id": USER_ID,
            "project_id": "test_verification",
            "scale": scale
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/generate/upscale", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ SUCCESS: Scale {scale}x returned 200.")
                print(f"URL: {data.get('url')}")
            else:
                print(f"✗ FAILURE: Scale {scale}x failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"Request exception: {e}")

if __name__ == "__main__":
    verify_upscale_resolutions()
