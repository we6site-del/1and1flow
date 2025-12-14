import requests
import uuid

BASE_URL = "http://localhost:8000"
DEBUG_ADMIN_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e"
RANDOM_USER_ID = str(uuid.uuid4())

def verify_admin_security():
    print("--- Verifying Admin Security ---")
    
    # 1. Test Valid Admin
    print(f"Testing with Valid Admin ID: {DEBUG_ADMIN_ID}")
    payload = {
        "user_id": RANDOM_USER_ID, # Dummy user to gift to
        "amount": 10,
        "reason": "Security Test",
        "admin_id": DEBUG_ADMIN_ID
    }
    try:
        # Note: We need a valid user_id to gift TO, otherwise it returns 404 User Not Found
        # But verify_admin_role happens BEFORE valid user check?
        # Let's see code.
        # if not verify_admin_role(): raise 403
        # ...
        # user_response = ... if not data: raise 404
        
        # So if we get 404, it means we passed 403 check.
        # If we get 403, we failed admin check.
        
        response = requests.post(f"{BASE_URL}/api/admin/credits/gift", json=payload)
        
        if response.status_code == 403:
            print("✗ FAILURE: Valid Admin was rejected (403).")
        elif response.status_code == 404:
             print("✓ SUCCESS: Valid Admin passed security check (got 404 for missing target user).")
        elif response.status_code == 200:
             print("✓ SUCCESS: Valid Admin passed security check (got 200).")
        else:
            print(f"UNKNOWN: Valid Admin got {response.status_code}: {response.text}")

    except Exception as e:
        print(f"Request failed: {e}")

    # 2. Test Invalid Admin
    print(f"\nTesting with Invalid Admin ID: {RANDOM_USER_ID}")
    payload["admin_id"] = RANDOM_USER_ID
    try:
        response = requests.post(f"{BASE_URL}/api/admin/credits/gift", json=payload)
        
        if response.status_code == 403:
            print("✓ SUCCESS: Invalid Admin was rejected (403).")
        else:
            print(f"✗ FAILURE: Invalid Admin got {response.status_code} (Expected 403).")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    verify_admin_security()
