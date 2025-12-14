import requests
import uuid

BASE_URL = "http://localhost:8000"
# Use a static image URL for testing (e.g. from placeholder)
# Or use one of the generated images from previous tests if known?
# Let's use a dummy public image.
TEST_IMAGE_URL = "https://picsum.photos/200/300"
USER_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e" # Admin ID

def verify_upscale():
    print("--- Verifying Upscale Fix ---")
    
    payload = {
        "image_url": TEST_IMAGE_URL,
        "user_id": USER_ID,
        "project_id": "test_verification"
    }
    
    try:
        print(f"Sending Upscale Request for {TEST_IMAGE_URL}...")
        # Note: This might take a few seconds as it calls Fal.ai
        response = requests.post(f"{BASE_URL}/api/generate/upscale", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("✓ SUCCESS: Upscale endpoint returned 200.")
            print(f"Upscaled Image URL: {data.get('url')}")
        else:
            print(f"✗ FAILURE: Upscale endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Request exception: {e}")

if __name__ == "__main__":
    verify_upscale()
