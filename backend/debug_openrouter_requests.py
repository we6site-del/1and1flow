
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def test_openrouter_raw():
    if not OPENROUTER_API_KEY:
        print("Error: OPENROUTER_API_KEY not found in env.")
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:3000", 
        "X-Title": "Lovart Flow (Local Dev)",
        "Content-Type": "application/json"
    }
    
    model = "black-forest-labs/flux.2-pro"
    prompt = "A futuristic city with flying cars, neon lights, cyberpunk style, high quality, 8k"
    
    data = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 1.0, # Adding some standard params
    }
    
    print(f"Sending request to {url}...")
    print(f"Model: {model}")
    print(f"Headers: {json.dumps(headers, default=lambda x: '<hidden>')}")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=60, verify=False)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print("Response Body:")
        print(response.text)
        
        if response.status_code == 200:
             json_resp = response.json()
             print("\nFull JSON Response:")
             print(json.dumps(json_resp, indent=2))
             if "choices" in json_resp and len(json_resp["choices"]) > 0:
                 content = json_resp["choices"][0]["message"]["content"]
                 print(f"\nContent: {content}")
             else:
                 print("\nNo choices in response.")
        else:
            print("\nRequest failed.")
            
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    test_openrouter_raw()
