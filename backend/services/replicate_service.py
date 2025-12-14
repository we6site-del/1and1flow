import replicate
import os
from fastapi import HTTPException

# Ensure REPLICATE_API_TOKEN is set
if not os.getenv("REPLICATE_API_TOKEN"):
    print("Warning: REPLICATE_API_TOKEN not set in environment variables")

# Initialize Replicate client
replicate_client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))

def generate_with_replicate(
    model_path: str,
    prompt: str,
    parameters: dict | None = None,
    references: list[str] | None = None
) -> str:
    """
    Generates content using Replicate API.
    
    Args:
        model_path: Model identifier (e.g., "kling-ai/kling-video-v2")
        prompt: Generation prompt
        parameters: Dynamic parameters from schema
        references: Reference image URLs
    
    Returns:
        URL of generated content
    """
    try:
        # Build input parameters
        input_params = {
            "prompt": prompt,
        }
        
        # Add dynamic parameters
        if parameters:
            input_params.update(parameters)
        
        # Add reference images if provided
        if references and len(references) > 0:
            if "image" in model_path.lower() or "video" in model_path.lower():
                # For video models, use start/end frames
                if len(references) >= 2:
                    input_params["start_image"] = references[0]
                    input_params["end_image"] = references[1]
                elif len(references) == 1:
                    input_params["image"] = references[0]
            else:
                # For image models
                input_params["image"] = references[0]
                if len(references) > 1:
                    input_params["image_urls"] = references[:3]
        
        print(f"Calling Replicate model: {model_path}")
        print(f"Input parameters: {input_params}")
        
        # Run the model
        output = replicate_client.run(
            model_path,
            input=input_params
        )
        
        # Handle different output formats
        if isinstance(output, str):
            return output
        elif isinstance(output, list) and len(output) > 0:
            # Some models return a list of URLs
            return output[0] if isinstance(output[0], str) else output[0].get("url", str(output[0]))
        elif isinstance(output, dict):
            # Some models return a dict with 'url' or 'video' key
            if "url" in output:
                return output["url"]
            elif "video" in output:
                return output["video"] if isinstance(output["video"], str) else output["video"].get("url", "")
            elif "output" in output:
                return output["output"] if isinstance(output["output"], str) else output["output"][0]
        
        raise Exception(f"Unexpected output format from Replicate: {type(output)}")
        
    except Exception as e:
        print(f"Replicate Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Replicate generation failed: {str(e)}")



def upscale_image(image_url: str, scale: int = 2) -> str:
    """
    Upscales an image using Replicate (Real-ESRGAN).
    """
    try:
        print(f"[Replicate] Upscaling image: {image_url}")
        
        output = replicate_client.run(
            "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab41b2ee43ad4095a1c",
            input={
                "image": image_url,
                "scale": scale,
                "face_enhance": True
            }
        )
        
        print(f"[Replicate] Upscale Result: {output}")
        return output

    except Exception as e:
        print(f"Replicate Upscale Error: {e}")
        raise HTTPException(status_code=500, detail=f"Upscale failed: {str(e)}")

def remove_background(image_url: str) -> str:
    """
    Removes background using Replicate (Rembg).
    """
    try:
        print(f"[Replicate] Removing background: {image_url}")
        
        output = replicate_client.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            input={
                "image": image_url
            }
        )
        
        print(f"[Replicate] Remove BG Result: {output}")
        return output

    except Exception as e:
        print(f"Replicate Remove BG Error: {e}")
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")
