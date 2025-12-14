from dotenv import load_dotenv
load_dotenv()

import os
import requests
from services import storage

def test_r2_upload_and_access():
    print("Testing R2 Upload and Access...")
    
    # 1. Upload dummy content
    content = b"fake image content"
    content_type = "image/jpeg"
    
    try:
        print("Uploading...")
        url = storage.upload_bytes_to_r2(content, content_type, folder="test_uploads")
        print(f"Uploaded URL: {url}")
        
        # 2. Try to access it
        print("Attempting to fetch URL...")
        response = requests.get(url)
        
        if response.status_code == 200:
            print("SUCCESS: URL is accessible.")
            print(f"Content length: {len(response.content)}")
            if response.content == content:
                print("Content matches!")
            else:
                print("Content mismatch!")
        else:
            print(f"FAILURE: URL returned status code {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    test_r2_upload_and_access()
