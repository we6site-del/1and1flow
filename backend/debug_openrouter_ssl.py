
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def test_openrouter_bypass_dns():
    print("--- Starting DNS Bypass Test ---")
    if not OPENROUTER_API_KEY:
        print("Error: OPENROUTER_API_KEY not found in env.")
        return

    # Real IP from DoH (Cloudflare)
    # 104.18.3.115 is one of them.
    real_ip = "104.18.3.115"
    hostname = "openrouter.ai"
    
    url = f"https://{real_ip}/api/v1/status"
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Host": hostname, # Host header is critical for Cloudflare routing
        "HTTP-Referer": "http://localhost:3000", 
        "X-Title": "Lovart Flow (Local Dev)",
    }
    
    print(f"Testing connection to {url} with Host: {hostname}")
    
    try:
        # verify=False to ignore SSL mismatch (cert is for openrouter.ai, IP is in URL)
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        print(f"Direct Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        if response.status_code == 200:
             print("SUCCESS: Connection established to OpenRouter via direct IP.")
        else:
             print("FAILURE: Connected but got non-200 status.")
    except Exception as e:
        print(f"Direct Request Failed: {e}")

if __name__ == "__main__":
    test_openrouter_bypass_dns()
