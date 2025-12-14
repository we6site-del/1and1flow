import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_gallery_api():
    print("\n--- Testing Prompt Gallery API ---")
    
    # 1. Test GET /prompts/gallery (Public)
    try:
        r = requests.get(f"{BASE_URL}/prompts/gallery?page=1&limit=5")
        if r.status_code == 200:
            data = r.json()
            print("SUCCESS: GET /prompts/gallery")
            print(f"Count: {data.get('count')}")
            print(f"Items: {len(data.get('data', []))}")
        else:
            print(f"FAILURE: GET /prompts/gallery - {r.status_code} {r.text}")
    except Exception as e:
        print(f"ERROR: {e}")

    # 2. Test GET /prompts/categories
    try:
        r = requests.get(f"{BASE_URL}/prompts/categories")
        if r.status_code == 200:
            print("SUCCESS: GET /prompts/categories")
            print(f"Categories: {r.json().get('categories')}")
        else:
            print(f"FAILURE: GET /prompts/categories - {r.status_code} {r.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_gallery_api()
