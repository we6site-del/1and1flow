import os
import time
from dotenv import load_dotenv
load_dotenv()
from services import openrouter_service

# Mock params
prompt = "test prompt aspect ratio"
model = "black-forest-labs/flux-schnell" # Use cheap/fast model
aspect_ratio = "16:9"

print(f"Testing generation with model: {model}, AR: {aspect_ratio}")
try:
    start = time.time()
    # Call service directly
    url = openrouter_service.generate_image(prompt, model, aspect_ratio=aspect_ratio)
    print(f"Success! URL: {url}")
except Exception as e:
    print(f"Failed: {e}")
