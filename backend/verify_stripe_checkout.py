import requests
import json
import os

# Config
BASE_URL = "http://localhost:8000"
USER_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e" # debug_admin@example.com
PLAN_ID = "pro-monthly" # Assuming this ID exists in DEFAULT_PLANS

def verify_stripe_checkout():
    print("--- Starting Verify Stripe Checkout ---")
    
    payload = {
        "user_id": USER_ID,
        "plan_id": PLAN_ID,
        "redirect_url": "http://localhost:3000/pricing",
        "is_yearly": False
    }
    
    print("Sending POST /api/stripe/checkout...")
    try:
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ SUCCESS: Checkout session created.")
            print(f"Session ID: {data.get('sessionId')}")
            print(f"URL: {data.get('url')}")
        else:
            print(f"✗ FAILURE: {response.text}")

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    verify_stripe_checkout()
