
import socket
import sys

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    result = s.connect_ex(('127.0.0.1', 8000))
    s.close()
    if result == 0:
        print("OPEN")
    else:
        print(f"CLOSED (code {result})")
except Exception as e:
    print(f"ERROR: {e}")
