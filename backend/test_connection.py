from services.supabase_client import supabase
import time

def test_connection():
    print("Testing Supabase connection...")
    try:
        start = time.time()
        response = supabase.table("projects").select("count", count="exact").limit(1).execute()
        end = time.time()
        print(f"Connection successful! Time: {end - start:.2f}s")
        print(f"Response: {response}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
