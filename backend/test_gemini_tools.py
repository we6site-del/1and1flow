
import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.append(os.getcwd())

load_dotenv()

from routers.chat import chat_with_google

async def test_tool_execution():
    print("Testing Gemini Tool Execution...")
    
    messages = [
        {"role": "user", "content": "Search for 2025 fashion trends"}
    ]
    
    try:
        iterator = chat_with_google("gemini-2.0-flash", messages)
        async for chunk in iterator:
            print(f"CHUNK: {chunk.strip()}")
            if "Search Results" in chunk:
                print("SUCCESS: Tool execution output found in stream.")
                return
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tool_execution())
