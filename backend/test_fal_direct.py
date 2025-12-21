import os
import sys
import logging
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Verify we can import the provider
try:
    from providers.fal import FalProvider
except ImportError:
    # Handle running from root or backend dir
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from backend.providers.fal import FalProvider

def test_fal_direct():
    print("\n=== Testing Fal.ai Direct Connection ===")
    
    # 1. Check API Key
    key = os.getenv("FAL_KEY")
    if not key:
        print("❌ Error: FAL_KEY not found in environment (.env)")
        print("Please ensure you are running this from the backend directory or have .env loaded.")
        return
    else:
        print(f"✅ FAL_KEY found: {key[:4]}...{key[-4:]}")

    # 2. Initialize Provider
    try:
        provider = FalProvider()
        print("✅ FalProvider initialized")
    except Exception as e:
        print(f"❌ Failed to initialize provider: {e}")
        return

    # 3. Test Generation
    print("\n🚀 Sending test generation request (Flux Pro)...")
    try:
        # Use a simple, fast generation parameter set
        url = provider.generate_image(
            prompt="A simple red cube on a white background, 3d render, minimalist",
            model_path="flux-pro",
            aspect_ratio="1:1"
        )
        
        print("\n🎉 SUCCESS!")
        print(f"Generated Image URL: {url}")
        print("Check if this URL is accessible in your browser.")
        
    except Exception as e:
        print("\n❌ GENERATION FAILED")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_fal_direct()
