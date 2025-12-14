import requests
import os
from dotenv import load_dotenv
from services.supabase_client import supabase

load_dotenv()

BASE_URL = "http://localhost:8000/api"
ADMIN_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e" # Debug admin ID

def get_a_user():
    # Get the *data* from the response object
    response = supabase.table("profiles").select("id, credits").limit(1).execute()
    if response.data:
        return response.data[0]
    return None

def test_gift_credits():
    user = get_a_user()
    if not user:
        print("No users found to test with.")
        return

    user_id = user['id']
    initial_credits = user.get('credits', 0)
    print(f"User {user_id} initial credits: {initial_credits}")

    print("\n--- Testing POST /admin/credits/gift ---")
    payload = {
        "user_id": user_id,
        "amount": 10,
        "reason": "Verification Script Test",
        "admin_id": ADMIN_ID
    }
    
    try:
        response = requests.post(f"{BASE_URL}/admin/credits/gift", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            # Verify update
            updated_user = supabase.table("profiles").select("credits").eq("id", user_id).execute().data[0]
            print(f"User credits after gift: {updated_user['credits']}")
            if updated_user['credits'] == initial_credits + 10:
                print("SUCCESS: Credits updated correctly.")
            else:
                print("FAILURE: Credits mismatch.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gift_credits()
