
import socket
import time
import sys

port = 8000
for i in range(10):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', port)) != 0:
            print("Port 8000 is FREE")
            sys.exit(0)
    print("Waiting for port 8000 to free...")
    time.sleep(1)
print("Port 8000 still BUSY")
sys.exit(1)
