
import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    print("No OPENROUTER_API_KEY")
    exit(1)

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

async def test_model(model_id):
    print(f"\n--- Testing {model_id} ---")
    try:
        response = await client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "user", "content": "Hello, simply say 'Model Working'"}
            ],
        )
        print("Success!")
        print(response.choices[0].message.content)
    except Exception as e:
        print(f"FAILED: {e}")

async def main():
    await test_model("z-ai/glm-4.6v")
    await test_model("z-ai/glm-4.5-air:free")

if __name__ == "__main__":
    asyncio.run(main())
