import requests

try:
    print("Fetching models from Frontend Proxy (port 3000)...")
    response = requests.get("http://localhost:3000/api/models")
    print(f"Status Code: {response.status_code}")
    print(f"Response Length: {len(response.text)}")
    print(f"Response Preview: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
