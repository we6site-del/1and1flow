from services import replicate_service
from dotenv import load_dotenv
import os

load_dotenv()

def test_replicate_tools():
    test_image = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"
    
    print("\nTesting Replicate Upscale...")
    try:
        url = replicate_service.upscale_image(test_image)
        print(f"Upscale Success: {url}")
    except Exception as e:
        print(f"Upscale Failed: {e}")

    print("\nTesting Replicate Remove Background...")
    try:
        url = replicate_service.remove_background(test_image)
        print(f"Remove BG Success: {url}")
    except Exception as e:
        print(f"Remove BG Failed: {e}")

if __name__ == "__main__":
    test_replicate_tools()
