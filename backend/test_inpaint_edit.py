import requests
import os
from io import BytesIO
from PIL import Image

BASE_URL = "http://127.0.0.1:8000/api"
# Use a known working image URL or a placeholder
TEST_IMAGE_URL = "https://fal.media/files/penguin/8b96901c015b4515858025215024227c_image.png" 
USER_ID = "test-user-id" # Replace with a valid user ID if needed, or mock the auth

def create_dummy_mask():
    img = Image.new('RGB', (100, 100), color = 'black')
    # Draw a white square in the middle
    for x in range(25, 75):
        for y in range(25, 75):
            img.putpixel((x, y), (255, 255, 255))
    
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf

def test_upload_mask():
    print("Testing /upload/mask...")
    mask_file = create_dummy_mask()
    files = {'file': ('mask.png', mask_file, 'image/png')}
    
    response = requests.post(f"{BASE_URL}/upload/mask", files=files)
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Mask URL: {data['url']}")
        return data['url']
    else:
        print(f"Failed: {response.status_code} - {response.text}")
        return None

def test_edit_image():
    print("\nTesting /generate/edit...")
    payload = {
        "image_url": TEST_IMAGE_URL,
        "prompt": "make it a cyberpunk city",
        "strength": 0.75,
        "user_id": USER_ID
    }
    
    # Note: This might fail if user credits are strictly enforced and the test user doesn't exist/have credits
    # But we want to see if it reaches the provider or fails with 402
    response = requests.post(f"{BASE_URL}/generate/edit", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Edit URL: {data['url']}")
    elif response.status_code == 402:
        print("Insufficient credits (Expected for test user)")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

def test_inpaint_image(mask_url):
    if not mask_url:
        print("\nSkipping inpaint test due to missing mask URL")
        return

    print("\nTesting /generate/inpaint...")
    payload = {
        "image_url": TEST_IMAGE_URL,
        "mask_url": mask_url,
        "prompt": "a red balloon",
        "user_id": USER_ID
    }
    
    response = requests.post(f"{BASE_URL}/generate/inpaint", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Inpaint URL: {data['url']}")
    elif response.status_code == 402:
        print("Insufficient credits (Expected for test user)")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    mask_url = test_upload_mask()
    test_edit_image()
    test_inpaint_image(mask_url)
