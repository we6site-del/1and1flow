import requests
import time

def check_health():
    url = "http://localhost:8000/docs" # Try to reach the docs page or a health endpoint if it exists
    print(f"Checking {url}...")
    try:
        start = time.time()
        response = requests.get(url, timeout=5)
        end = time.time()
        print(f"Status Code: {response.status_code}")
        print(f"Time: {end - start:.2f}s")
    except Exception as e:
        print(f"Failed to reach backend: {e}")

if __name__ == "__main__":
    check_health()
