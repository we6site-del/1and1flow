
import json
import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
base_url = "https://openrouter.ai/api/v1"

client = AsyncOpenAI(api_key=api_key, base_url=base_url)

async def main():
    print("--- constructing Image Payload ---")
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe this fabric."},
                {"type": "image_url", "image_url": {"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"}}
            ]
        }
    ]

    print("\n--- Sending Request to OpenRouter ---")
    # Try with BOTH models to see who fails
    models = ["z-ai/glm-4.6v", "google/gemini-2.0-flash-exp:free"]
    
    
    
    # Tool Definition for testing (FULL LIST)
    tools = [
        {
            "type": "function",
            "function": {
                "name": "generate_fabric",
                "description": "Generate fabric textures based on a description.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "Description of the fabric texture"},
                    },
                    "required": ["prompt"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "generate_content",
                "description": "Trigger generation for an existing AI node.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_id": {"type": "string", "description": "The ID of the node"},
                    },
                    "required": ["node_id"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "Search the web for current information.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The search query"},
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "create_ai_node",
                "description": "Create a new AI generation node (image or video) on the canvas.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["image", "video"], "description": "The type of generation node to create"},
                        "prompt": {"type": "string", "description": "The generation prompt for the AI model"},
                        "model_id": {"type": "string", "description": "Optional: Specific model ID"},
                        "x": {"type": "number", "description": "Optional: X position"},
                        "y": {"type": "number", "description": "Optional: Y position"},
                    },
                    "required": ["type", "prompt"],
                },
            },
        }
    ]

    for model in models:
        print(f"\n[Testing Model: {model}]")
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools, # ADDED TOOLS
                tool_choice="auto",
                stream=False
            )
            print("  SUCCESS!")
        except Exception as e:
            print(f"  FAILED: {e}")
            if hasattr(e, 'response'):
                print(f"  Response Status: {e.response.status_code}")
                print(f"  Response Body: {e.response.text}")

if __name__ == "__main__":
    asyncio.run(main())
