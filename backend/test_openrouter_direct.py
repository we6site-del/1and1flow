
import os
import sys
from dotenv import load_dotenv

# Load env from .env file
load_dotenv()

# Add backend directory to sys.path to import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services import openrouter_service

def test_generation():
    print("Testing OpenRouter Generation...")
    model = "black-forest-labs/flux.2-pro" # The model found in DB
    prompt = "A futuristic city with flying cars, neon lights, cyberpunk style, high quality, 8k"
    
    print(f"Model: {model}")
    print(f"Prompt: {prompt}")
    
    try:
        url = openrouter_service.generate_image(prompt, model)
        print(f"SUCCESS: Generated Image URL: {url}")
    except Exception as e:
        print(f"FAILURE: Generation failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generation()
