
import socket
import os
import requests
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Save original getaddrinfo
_original_getaddrinfo = socket.getaddrinfo

def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == "openrouter.ai":
        print(f"DEBUG: Intercepted DNS for {host}, returning 104.18.3.115")
        # Return format: list of (family, type, proto, canonname, sockaddr)
        # sockaddr for IPv4 is (address, port)
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('104.18.3.115', port))]
    return _original_getaddrinfo(host, port, family, type, proto, flags)

def test_monkeypatch():
    # Apply patch
    socket.getaddrinfo = patched_getaddrinfo
    
    url = "https://openrouter.ai/api/v1/status"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:3000", # Optional, for including your app on openrouter.ai rankings.
        "X-Title": "Lovart Flow (Local Dev)", # Optional. Shows in rankings on openrouter.ai.
    }
    
    print(f"Testing patched connection to {url}")
    try:
        # We use normal requests, it should use proper SNI because URL has domain.
        # But getaddrinfo will give the IP we want.
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(response.text)
    except Exception as e:
        print(f"Patched Request Failed: {e}")
    finally:
        # Restore (good practice, though script ends)
        socket.getaddrinfo = _original_getaddrinfo

if __name__ == "__main__":
    test_monkeypatch()
