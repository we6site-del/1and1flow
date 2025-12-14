import time
import os
import os
from dotenv import load_dotenv
load_dotenv()
from services import storage
from services import dns_patch
dns_patch.install_patch()

print("Testing R2 upload...")
try:
    # Use a small test file (data URI)
    dummy_file = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    start = time.time()
    url = storage.upload_to_r2(dummy_file, folder="debug_test")
    print(f"Success! URL: {url}")
    print(f"Time taken: {time.time() - start:.2f}s")
except Exception as e:
    print(f"Failed: {e}")
    import traceback
    traceback.print_exc()
