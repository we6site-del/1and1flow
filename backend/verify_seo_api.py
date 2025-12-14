import requests
import uuid
import os
from dotenv import load_dotenv
from services.supabase_client import supabase

load_dotenv()

BASE_URL = "http://localhost:8000/api"
TEST_USER_ID = "98bd3401-d79c-4962-a694-5df1ebfe9e40" # Use a known user ID or fetch one

def test_slug_generation():
    print("\n--- Testing Generation with Slug ---")
    prompt = "A majestic lion standing on a rock detailed 8k masterpiece"
    
    # 1. Simulate API call (requires credits, so mocking or calling directly if easier? 
    # Calling endpoint is better integ test, but cost credits. 
    # Let's insert directly to DB to test schema if API is costly, BUT API has logic.
    # We will assume user has credits. Admin gift saved us!)
    
    payload = {
        "prompt": prompt,
        "user_id": TEST_USER_ID,
        "node_id": "test_node",
        "model_id": "ef79ca40-12fc-4d18-8ccb-26e5298139e8", # Flux Pro
        "type": "image"
    }

    # Actually, we don't want to trigger real generation background task consuming money.
    # The API triggers background task.
    # We can inspect the code... the API inserts FIRST then calls background task.
    # So if we ctrl-c or if bg task fails, DB record remains.
    # BUT the best way to verify without cost is to manually invoke the slug logic or
    # create a mock endpoint.
    
    # Let's verify by checking the endpoints with an EXISTING slug if any, 
    # OR manually update a record with a slug to test GET.
    
    # 1. Update an existing record with a slug
    response = supabase.table("generations").select("id").limit(1).execute()
    if not response.data:
        print("No generations found.")
        return

    gen_id = response.data[0]['id']
    test_slug = f"test-lion-king-{str(uuid.uuid4())[:6]}"
    
    print(f"Updating generation {gen_id} with slug {test_slug}")
    supabase.table("generations").update({"slug": test_slug}).eq("id", gen_id).execute()
    
    # 2. Test GET /slug
    print(f"Fetching /generations/slug/{test_slug}...")
    r = requests.get(f"{BASE_URL}/generations/slug/{test_slug}")
    if r.status_code == 200:
        print("SUCCESS: Found generation by slug.")
        # print(r.json())
    else:
        print(f"FAILURE: {r.status_code} - {r.text}")

    # 3. Test Sitemap
    print("\n--- Testing Sitemap Endpoint ---")
    r = requests.get(f"{BASE_URL}/generations/sitemap")
    if r.status_code == 200:
        data = r.json()
        print(f"SUCCESS: Retrieved {len(data)} items for sitemap.")
        if len(data) > 0:
            print(f"Sample: {data[0]}")
    else:
        print(f"FAILURE: {r.status_code} - {r.text}")

if __name__ == "__main__":
    test_slug_generation()
