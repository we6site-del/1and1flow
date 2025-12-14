
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Add backend to path so we can import services
sys.path.append(os.getcwd())

# This import should trigger the patch installation
from services import openrouter_service
import requests

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def verify_connectivity():
    print("--- Verifying OpenRouter Fix ---")
    
    # 1. Test requests (should be patched globally if socket.getaddrinfo is patched)
    url = "https://openrouter.ai/api/v1/status"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:3000", 
    }
    
    print(f"Testing connection to {url}...")
    try:
        # We do NOT use verify=False here. We want to prove that SSL works because we are sending the correct Hostname 
        # but the underlying socket connects to the right IP.
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Connection to OpenRouter established via patched DNS.")
        else:
             print("WARNING: Connected but got non-200 status (likely Auth or 404 for this endpoint).")
             
    except Exception as e:
        print(f"FAILURE: Request still failed: {e}")

    # 2. Test OpenRouter Service function (dry run if possible, or just generate image)
    print("\n--- Testing Image Generation ---")
    try:
        # We try a simple generation to see if we get content
        # model = "black-forest-labs/flux.2-pro"
        # Using a cheaper/faster model for verification if possible, but user used flux.2-pro
        model = "black-forest-labs/flux.2-pro" 
        prompt = "A simple red cube, 3d render"
        
        print(f"Generating image with model: {model} (Aspect Ratio: 16:9)")
        
        # We need to manually call the internal logic or just use the service function
        # But verify_openrouter_service.py imports 'services' which imports 'dns_patch'
        
        # Let's call the service function directly
        # Test 16:9 aspect ratio
        url = openrouter_service.generate_image(prompt, model, aspect_ratio="16:9")
        
        url_preview = url
        if url and len(url) > 100:
             url_preview = url[:50] + "... [TRUNCATED Data URI/Long URL]"
        print(f"Service returned URL: {url_preview}")
        
        # Now verify storage upload if it looks like a data URI
        from services import storage
        print("Uploading to R2...")
        final_url = storage.upload_to_r2(url, folder="verify_openrouter_fix")
        print(f"SUCCESS: Final Public URL: {final_url}")
        
    except Exception as e:
        print(f"FAILURE: Generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_connectivity()
