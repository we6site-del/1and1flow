import os
import time
from dotenv import load_dotenv
load_dotenv()
from services import openrouter_service

# Mock params
prompt = "test prompt"
model = "black-forest-labs/flux-schnell"
# model = "gemini-3-pro" 
# model = "google/gemini-pro-1.5" # Try valid one later if needed

print(f"Testing generation with model: {model}")
try:
    start = time.time()
    url = openrouter_service.generate_image(prompt, model)
    print(f"Success! URL: {url}")
except Exception as e:
    print(f"Failed after {time.time() - start:.2f}s: {e}")
