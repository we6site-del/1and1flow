import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000/api"
ADMIN_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e" # Debug admin ID

def test_get_settings():
    print("\n--- Testing GET /admin/settings ---")
    try:
        response = requests.get(f"{BASE_URL}/admin/settings")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")

def test_update_setting():
    print("\n--- Testing POST /admin/settings ---")
    payload = {
        "key": "payment_methods",
        "value": ["card", "alipay", "wechat_pay"],
        "description": "Updated via verification script",
        "admin_id": ADMIN_ID
    }
    try:
        response = requests.post(f"{BASE_URL}/admin/settings", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Verifying Settings API...")
    # 1. Get initial
    test_get_settings()
    
    # 2. Update
    test_update_setting()
    
    # 3. Get again to verify
    test_get_settings()
