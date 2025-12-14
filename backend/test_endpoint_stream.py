
import requests
import json
import time

url = "http://localhost:8000/api/chat"
headers = {"Content-Type": "application/json"}
data = {
    "messages": [{"role": "user", "content": "Hello, are you working?"}],
    "model": "google/gemini-2.0-flash-exp:free" 
}

print(f"--- Testing {url} ---")
print(f"Payload: {json.dumps(data)}")

try:
    with requests.post(url, json=data, headers=headers, stream=True, timeout=30) as r:
        print(f"Status Code: {r.status_code}")
        if r.status_code != 200:
            print(f"Error Body: {r.text}")
            exit(1)
            
        print("--- Stream Start ---")
        start_time = time.time()
        for line in r.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                print(f"Received ({time.time() - start_time:.2f}s): {decoded}")
        print("\n--- Stream End ---")
        
except Exception as e:
    print(f"CRITICAL FAILURE: {e}")
