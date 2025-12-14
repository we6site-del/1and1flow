
import os

try:
    with open("backend/debug_gen.log", "rb") as f:
        # Seek to end
        f.seek(0, os.SEEK_END)
        size = f.tell()
        # Read last 20KB
        read_size = min(size, 20000)
        f.seek(-read_size, os.SEEK_END)
        content = f.read()
        
        print(f"Log Size: {size} bytes")
        print("--- Last 20KB of Log ---")
        # Decode gracefully
        print(content.decode('utf-8', errors='replace'))
except Exception as e:
    print(f"Error reading log: {e}")
