import replicate
import os
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("REPLICATE_API_TOKEN")
print(f"Token: {token[:5]}...{token[-5:] if token else ''}")

try:
    client = replicate.Client(api_token=token)
    # Try to get a public model to verify auth
    model = client.models.get("kling-ai/kling-video-v2")
    print(f"Successfully accessed model: {model.name}")
except Exception as e:
    print(f"Error: {e}")
