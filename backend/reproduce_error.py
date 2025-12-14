
import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)


async def test_case(name, text_value, model="google/gemini-2.0-flash-lite-001"):
    print(f"\n--- Testing Case: {name} (text='{text_value}') ---")
    
    # Small 1x1 red pixel base64
    base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    content_parts = []
    if text_value is not None:
        content_parts.append({"type": "text", "text": text_value})
    
    content_parts.append({"type": "image_url", "image_url": {"url": base64_image}})

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": content_parts}
    ]
    
    try:
        response = await client.chat.completions.create(
            # Using flash-lite as it might have better availability/allowance
            model=model,
            messages=messages,
        )
        print("Success!")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"FAILED: {e}")




async def main():
    print("\n--- Testing GLM-4.6V with Structured Content ---")
    messages_structured = [
        {
            "role": "user", 
            "content": [
                {"type": "text", "text": "You are a Fashion Design Copilot.\n\nTurn my rough sketch into a realistic dress..."}
            ]
        }
    ]
    try:
        response = await client.chat.completions.create(
            model="z-ai/glm-4.6v",
            messages=messages_structured,
        )
        print("Success (Structured)!")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"FAILED (Structured): {e}")

    print("\n--- Testing GLM-4.6V with Pure String Content ---")
    messages_string = [
        {
            "role": "user", 
            "content": "You are a Fashion Design Copilot.\n\nTurn my rough sketch into a realistic dress..."
        }
    ]
    try:
        response = await client.chat.completions.create(
            model="z-ai/glm-4.6v",
            messages=messages_string,
        )
        print("Success (String)!")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"FAILED (String): {e}")

if __name__ == "__main__":
    asyncio.run(main())
