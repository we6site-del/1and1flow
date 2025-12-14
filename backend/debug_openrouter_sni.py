
import socket
import ssl
import os
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def test_sni_connection():
    hostname = "openrouter.ai"
    # real_ip = "104.18.3.115"
    real_ip = "104.18.3.115" # Cloudflare
    port = 443
    
    context = ssl.create_default_context()
    # If we want to verify the cert, we must tell it the hostname we EXPECT, 
    # but we are connecting to an IP.
    context.check_hostname = False # We will do manual verification or skip for now
    context.verify_mode = ssl.CERT_NONE # For debug, to rule out local cert store issues
    
    print(f"Connecting to {real_ip}:{port} with SNI={hostname}...")
    
    try:
        sock = socket.create_connection((real_ip, port), timeout=10)
        ssock = context.wrap_socket(sock, server_hostname=hostname)
        
        print(f"Cipher: {ssock.cipher()}")
        print(f"Protocol: {ssock.version()}")
        
        # Send HTTP GET
        request = (
            f"GET /api/v1/status HTTP/1.1\r\n"
            f"Host: {hostname}\r\n"
            f"Authorization: Bearer {OPENROUTER_API_KEY}\r\n"
            f"Connection: close\r\n"
            f"\r\n"
        )
        ssock.write(request.encode("utf-8"))
        
        response = b""
        while True:
            data = ssock.read(1024)
            if not data:
                break
            response += data
            
        print("\n--- Response ---")
        print(response.decode("utf-8", errors="ignore"))
        print("\nSuccess! Connection established with SNI.")
        ssock.close()
        
    except Exception as e:
        print(f"SNI Connection Failed: {e}")

if __name__ == "__main__":
    test_sni_connection()
