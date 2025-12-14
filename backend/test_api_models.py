import requests

try:
    print("Fetching models from API...")
    response = requests.get("http://localhost:8000/api/models")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
