import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def list_models():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY not found in environment")
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Lovart Flow"
    }

    try:
        response = requests.get("https://openrouter.ai/api/v1/models", headers=headers)
        response.raise_for_status()
        data = response.json()["data"]
        
        print("\nGLM Models:")
        for model in data:
            if "glm" in model["id"].lower() or "zhipu" in model["name"].lower():
                print(f"- {model['id']} ({model['name']})")
                
    except Exception as e:
        print(f"Error fetching models: {e}")

if __name__ == "__main__":
    list_models()
