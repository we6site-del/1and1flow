import asyncio
import websockets
import sys

async def test_connection(uri, origin=None):
    headers = {}
    if origin:
        headers["Origin"] = origin
    
    print(f"Testing connection to {uri} with Origin: {origin}")
    try:
        async with websockets.connect(uri, extra_headers=headers) as websocket:
            print(f"✅ Connection successful!")
            await websocket.close()
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

async def main():
    room_id = "test-room"
    uri = f"ws://localhost:8000/api/ws/{room_id}"
    
    print("--- Test 1: No Origin (Native Client) ---")
    await test_connection(uri)
    
    print("\n--- Test 2: Origin = http://localhost:8000 ---")
    await test_connection(uri, origin="http://localhost:8000")
    
    print("\n--- Test 3: Origin = https://lunyee.cn ---")
    await test_connection(uri, origin="https://lunyee.cn")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ImportError:
        print("Please install websockets: pip install websockets")
