import requests
import json
import os
from services.supabase_client import supabase

# Config
BASE_URL = "http://localhost:8000"
USER_ID = "6d59c8f2-84b5-48fd-9698-bf2c55e7115e" # debug_admin@example.com
MODEL_ID = "ef79ca40-12fc-4d18-8ccb-26e5298139e8" # Flux Schnell
NODE_ID = "test-node-123"
PROJECT_ID = "00000000-0000-0000-0000-000000000000" # Dummy UUID

def get_user_credits(user_id):
    # Assuming 'users' table has 'credits' column? Or 'profiles'?
    # Let's try 'profiles' first as per typical Refine/Supabase setup, or check 'users' via admin API
    # But supabase_client usually has service role.
    
    # Try 'profiles' first
    try:
        res = supabase.table("profiles").select("credits").eq("id", user_id).execute()
        if res.data:
            return res.data[0]['credits']
    except Exception as e:
        print(f"Error fetching profile credits: {e}")
    
    return None

def verify_generate():
    print("--- Starting Verify Generate Flow ---")
    
    # 1. Check Initial Credits
    initial_credits = get_user_credits(USER_ID)
    print(f"Initial Credits: {initial_credits}")
    
    if initial_credits is None:
        print("Could not fetch credits. Aborting.")
        return

    # 2. Send Generate Request
    payload = {
        "prompt": "A test image of a cat",
        "user_id": USER_ID,
        "node_id": NODE_ID,
        "project_id": None,
        "model_id": MODEL_ID,
        "type": "image",
        "parameters": {"aspect_ratio": "1:1"}
    }
    
    print("Sending POST /api/generate...")
    try:
        response = requests.post(f"{BASE_URL}/api/generate", json=payload)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code != 200:
            print("Request failed!")
            # If 402, maybe insufficient credits
            return
            
        data = response.json()
        generation_id = data.get("generation_id")
        print(f"Generation ID: {generation_id}")
        
    except Exception as e:
        print(f"Request failed: {e}")
        return

    # 3. Check Credits Deducted
    # Flux Schnell might cost 4 credits (based on audit)
    # Wait a moment for DB update if needed (RPC is usually immediate)
    import time
    time.sleep(1)
    
    final_credits = get_user_credits(USER_ID)
    print(f"Final Credits: {final_credits}")
    
    if final_credits is not None:
        diff = initial_credits - final_credits
        print(f"Credits Deducted: {diff}")
        if diff > 0:
            print("✓ SUCCESS: Credits deducted.")
        else:
            print("✗ FAILURE: Credits NOT deducted.")
            
    # 4. Verjfy Generation Record Created
    res = supabase.table("generations").select("*").eq("id", generation_id).execute()
    if res.data and len(res.data) > 0:
        print("✓ SUCCESS: Generation record found.")
        print(f"Record Status: {res.data[0]['status']}")
    else:
        print("✗ FAILURE: Generation record not found.")

if __name__ == "__main__":
    verify_generate()
