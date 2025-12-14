from services import fal_ai
from dotenv import load_dotenv
import os

load_dotenv()

def test_image():
    print("Testing Image Generation...")
    try:
        url = fal_ai.generate_image(
            prompt="A cute cat",
            model="flux-pro",
            aspect_ratio="1:1",
            parameters={"safety_tolerance": "2"}
        )
        print(f"Image Success: {url}")
    except Exception as e:
        print(f"Image Failed: {e}")

def test_video():
    print("\nTesting Video Generation...")
    try:
        url = fal_ai.generate_video(
            prompt="A cat running",
            model="kling-pro",
            duration="5s",
            aspect_ratio="16:9",
            parameters={"safety_tolerance": "2"}
        )
        print(f"Video Success: {url}")
    except Exception as e:
        print(f"Video Failed: {e}")

def test_image_with_reference():
    # Test Image Generation with Reference
    print("\nTesting Image Generation with Reference...")
    try:
        url = fal_ai.generate_image(
            prompt="A cyberpunk version of this image",
            model="flux-pro",
            references=["https://pub-6d184072434a418fb5462c6de3117397.r2.dev/test_uploads/bd7f3a08-3388-4ed0-a1f1-e70d20033848.jpg"]
        )
        print(f"Image URL: {url}")
    except Exception as e:
        print(f"Image Generation Failed: {e}")

if __name__ == "__main__":
    # test_image()
    # test_video()
    test_image_with_reference()
