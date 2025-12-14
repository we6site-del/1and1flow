import asyncio
import websockets
import sys

async def test_websocket(room_id="test-room", message="Hello World"):
    uri = f"ws://localhost:8000/api/ws/{room_id}"
    async with websockets.connect(uri) as websocket:
        print(f"Connected to {uri}")
        await websocket.send(message)
        print(f"Sent: {message}")
        
        # In broadcast mode, we might not receive our OWN message depending on implementation
        # Our implementation says: `if connection != sender: ...`
        # So we need a listening client.
        
        # But for this test, let's just connect and hold.
        # We need two processes to test broadcast.
        pass

async def listen(room_id="test-room"):
    uri = f"ws://localhost:8000/api/ws/{room_id}"
    async with websockets.connect(uri) as websocket:
        print(f"Listening on {uri}...")
        while True:
            msg = await websocket.recv()
            print(f"Received: {msg}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "listen":
        asyncio.run(listen())
    else:
        asyncio.run(test_websocket())
