import fal_client
import os
from fastapi import HTTPException

# Ensure FAL_KEY is set
if not os.getenv("FAL_KEY"):
    print("Warning: FAL_KEY not set in environment variables")

def generate_image(prompt: str, model: str = "flux-pro", aspect_ratio: str = "1:1", references: list[str] | None = None, parameters: dict | None = None, resolution: str | None = None, num_images: int = 1) -> str:
    """
    Generates an image using Fal.ai (Flux Pro).
    Returns the URL of the generated image.
    """
    try:
        # Use the provided model string as the endpoint directly if it looks like a FAL path
        # Otherwise fall back to mapping for legacy support
        endpoint = model
        if not "/" in model:
            if model == "flux-dev":
                endpoint = "fal-ai/flux/dev"
            else:
                endpoint = "fal-ai/flux-pro/v1.1"
            
        print(f"[FAL] Generating image with endpoint: {endpoint}, n={num_images}")
            
        # Map aspect ratio to image_size
        image_size = "square"
        if aspect_ratio == "16:9":
            image_size = "landscape_16_9"
        elif aspect_ratio == "9:16":
            image_size = "portrait_16_9"
        elif aspect_ratio == "4:3":
            image_size = "landscape_4_3"
        elif aspect_ratio == "3:4":
            image_size = "portrait_4_3"

        # Override with explicit resolution if provided (format "WxH")
        # FAL often takes image_size dict {width: w, height: h} for custom sizes if supported
        arguments = {
            "prompt": prompt,
            "image_size": image_size,
            "num_images": num_images,
            "safety_tolerance": "2", # Allow some creative freedom
        }
        
        if resolution and "x" in resolution:
            try:
                w, h = map(int, resolution.split("x"))
                arguments["image_size"] = { "width": w, "height": h }
            except:
                pass # Fallback to aspect ratio default
        
        # Merge dynamic parameters if provided
        if parameters:
            # Handle common parameter mappings for Fal compatibility
            mapped_params = parameters.copy()
            
            # Map 'format' or 'image_format' to 'output_format'
            if "format" in mapped_params:
                mapped_params["output_format"] = mapped_params.pop("format")
            if "image_format" in mapped_params:
                mapped_params["output_format"] = mapped_params.pop("image_format")
            
            # Additional parameter mappings
            if "steps" in mapped_params and "num_inference_steps" not in mapped_params:
                mapped_params["num_inference_steps"] = mapped_params.pop("steps")
            
            # Allow common parameters to pass through
            # guidance_scale, num_inference_steps, seed, enable_safety_checker
            
            arguments.update(mapped_params)
        
        # Add reference images if provided
        if references and len(references) > 0:
            # Special handling for models that require 'image_urls' (plural) even for single image
            if "nano-banana" in model:
                arguments["image_urls"] = references[:3]
            else:
                arguments["image_url"] = references[0]  # Use first reference as main image
                # Some models support multiple reference images via image_urls array
                if len(references) > 1:
                     # For flux/dev, typically 'image_url' is single. 
                     # Some implementations allow list. We keep single for safety unless known otherwise.
                     pass 
        
        print(f"[FAL] Arguments: {arguments}")
        
        handler = fal_client.submit(
            endpoint,
            arguments=arguments,
        )

        result = handler.get()
        print(f"[FAL] Result: {result}")
        
        if not result or "images" not in result or not result["images"]:
            raise Exception("No images returned from Fal.ai")
            
        return result["images"][0]["url"]

    except Exception as e:
        print(f"Fal.ai Image Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

def generate_video(prompt: str, model: str = "kling-pro", duration: str = "5s", aspect_ratio: str = "16:9", references: list[str] | None = None, parameters: dict | None = None) -> str:
    """
    Generates a video using Fal.ai (Kling).
    Returns the URL of the generated video.
    """
    try:
        # Use the provided model string as the endpoint directly if it looks like a FAL path
        endpoint = model
        if not "/" in model:
            endpoint = "fal-ai/kling-video/v1/standard/text-to-video"
            if model == "luma-dream-machine":
                endpoint = "fal-ai/luma-dream-machine"

        print(f"[FAL] Generating video with endpoint: {endpoint}")

        # Map duration
        duration_seconds = 5
        if duration == "10s":
            duration_seconds = 10

        arguments = {
            "prompt": prompt,
            "duration": str(duration_seconds),
            "aspect_ratio": aspect_ratio
        }
        
        # Merge dynamic parameters if provided
        if parameters:
            arguments.update(parameters)
            
        # Ensure duration is correct format (strip 's')
        if "duration" in arguments:
            d = str(arguments["duration"])
            if d.endswith("s"):
                arguments["duration"] = d.replace("s", "")
        
        
        # Handle endpoint switching for Kling if no references
        if "kling" in endpoint and "image-to-video" in endpoint:
            has_refs = False
            if references and len(references) > 0:
                 has_refs = True
            
            if not has_refs:
                print(f"Switching {endpoint} to text-to-video variant")
                endpoint = endpoint.replace("image-to-video", "text-to-video")

        # Add reference images (start/end frames) if provided
        if references and len(references) > 0:
            if len(references) >= 2:
                # Use first as start frame, second as end frame
                if isinstance(references[0], str):
                    arguments["image_url"] = references[0]
                elif isinstance(references[0], dict) and "url" in references[0]:
                    arguments["image_url"] = references[0]["url"]
                    
                if isinstance(references[1], str):
                    arguments["end_image_url"] = references[1]
                elif isinstance(references[1], dict) and "url" in references[1]:
                    arguments["end_image_url"] = references[1]["url"]

            elif len(references) == 1:
                # Use single reference as start frame
                if isinstance(references[0], str):
                    arguments["image_url"] = references[0]
                elif isinstance(references[0], dict) and "url" in references[0]:
                     arguments["image_url"] = references[0]["url"]

        print(f"[FAL] Arguments: {arguments}")
        print(f"[FAL] Endpoint: {endpoint}")

        handler = fal_client.submit(
            endpoint,
            arguments=arguments,
        )

        result = handler.get()
        print(f"[FAL] Result: {result}")
        
        if not result or "video" not in result or not result["video"]:
             # Some endpoints return 'video_url' or different structure, check docs if needed.
             # For Kling on Fal, it usually returns 'video' object with 'url'
             if "video_url" in result:
                 return result["video_url"]
             raise Exception("No video returned from Fal.ai")
            
        return result["video"]["url"]

    except Exception as e:
        print(f"Fal.ai Video Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

def upscale_image(image_url: str, scale: int = 2) -> str:
    """
    Upscales an image using Fal.ai (Creative Upscaler).
    """
    try:
        print(f"[FAL] Upscaling image: {image_url} (Scale: {scale}x)")
        
        handler = fal_client.submit(
            "fal-ai/creative-upscaler",
            arguments={
                "image_url": image_url,
                "scale": scale, 
                "creativity": 0.35, # Moderate creativity to preserve details
                "override_size_limits": True
            },
        )

        result = handler.get()
        print(f"[FAL] Upscale Result: {result}")
        
        if not result or "image" not in result or not result["image"]:
             raise Exception("No image returned from Fal.ai Upscaler")
            
        return result["image"]["url"]

    except Exception as e:
        print(f"Fal.ai Upscale Error: {e}")
        raise HTTPException(status_code=500, detail=f"Upscale failed: {str(e)}")

def remove_background(image_url: str) -> str:
    """
    Removes background using Fal.ai (Bria).
    """
    try:
        print(f"[FAL] Removing background: {image_url}")
        
        handler = fal_client.submit(
            "fal-ai/birefnet",
            arguments={
                "image_url": image_url,
            },
        )

        result = handler.get()
        print(f"[FAL] Remove BG Result: {result}")
        
        if not result or "image" not in result or not result["image"]:
             raise Exception("No image returned from Fal.ai Remove BG")
            
        return result["image"]["url"]

    except Exception as e:
        print(f"Fal.ai Remove BG Error: {e}")
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

def inpaint_image(image_url: str, mask_url: str, prompt: str = "fill with background") -> str:
    """
    Inpaints an image using Fal.ai (Flux Fill).
    """
    try:
        print(f"[FAL] Inpainting image: {image_url} with mask: {mask_url}")
        
        handler = fal_client.submit(
            "fal-ai/flux/fill",
            arguments={
                "image_url": image_url,
                "mask_url": mask_url,
                "prompt": prompt,
                "image_size": "square", # Flux fill handles aspect ratios well, but square is safe default
                "safety_tolerance": "2",
            },
        )

        result = handler.get()
        print(f"[FAL] Inpaint Result: {result}")
        
        if not result or "images" not in result or not result["images"]:
             raise Exception("No image returned from Fal.ai Inpainting")
            
        return result["images"][0]["url"]

    except Exception as e:
        print(f"Fal.ai Inpaint Error: {e}")
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(e)}")

def edit_image(image_url: str, prompt: str, strength: float = 0.75) -> str:
    """
    Edits an image using Fal.ai (Flux Dev Image-to-Image).
    """
    try:
        print(f"[FAL] Editing image: {image_url} with prompt: {prompt}")
        
        handler = fal_client.submit(
            "fal-ai/flux/dev",
            arguments={
                "prompt": prompt,
                "image_url": image_url,
                "strength": strength,
                "image_size": "square", # Flux handles aspect ratios, but square is safe default
                "safety_tolerance": "2",
            },
        )

        result = handler.get()
        print(f"[FAL] Edit Result: {result}")
        
        if not result or "images" not in result or not result["images"]:
             raise Exception("No image returned from Fal.ai Edit")
            
        return result["images"][0]["url"]

    except Exception as e:
        print(f"Fal.ai Edit Error: {e}")
        raise HTTPException(status_code=500, detail=f"Editing failed: {str(e)}")

def generate_mockup(image_url: str, prompt: str) -> str:
    """
    Generates a mockup using Fal.ai (Flux Dev).
    Basically an image-to-image generation where the user image is the base.
    """
    try:
        print(f"[FAL] Generating mockup for: {image_url} with prompt: {prompt}")
        
        # We use a strength of 0.85 to allow significant changes while keeping overall composition if needed,
        # but for true mockups (placing image onto object), straightforward IMG2IMG might vary.
        # A better approach for specific mockups is "Flux Fill" if we had a mask, 
        # but without a mask, "Flux Dev" with high strength or ControlNet is best.
        # Here we'll use Flux Dev with a lower strength to guide the shape, or high strength to completely recontextualize?
        # Let's try high strength to allow the model to build the scene around the image content.
        
        handler = fal_client.submit(
            "fal-ai/flux/dev",
            arguments={
                "prompt": prompt,
                "image_url": image_url,
                "strength": 0.95, # Very high strength to generate a new scene incorporating the image colors/structures
                "image_size": "square",
                "safety_tolerance": "2",
            },
        )

        result = handler.get()
        print(f"[FAL] Mockup Result: {result}")
        
        if not result or "images" not in result or not result["images"]:
             raise Exception("No image returned from Fal.ai Mockup")
            
        return result["images"][0]["url"]

    except Exception as e:
        print(f"Fal.ai Mockup Error: {e}")
        raise HTTPException(status_code=500, detail=f"Mockup generation failed: {str(e)}")

def expand_image(image_url: str, prompt: str, direction: str = "right", amount: float = 0.5) -> str:
    """
    Expands an image using Fal.ai (Flux Fill/Pro).
    Note: This is a simplified implementation. Real outpainting requires preprocessing the image 
    to place it on a larger canvas and masking the empty area.
    For this MVP, we will rely on Fal's outpainting playground capability if available, or 
    manually prep the image here using Pillow before sending to Flux Fill.
    """
    try:
        import requests
        from PIL import Image
        import io

        print(f"[FAL] Expanding image: {image_url}, Direction: {direction}, Amount: {amount}")

        # 1. Download image
        response = requests.get(image_url)
        img = Image.open(io.BytesIO(response.content)).convert("RGBA")
        width, height = img.size

        # 2. Calculate new dimensions
        new_width, new_height = width, height
        offset_x, offset_y = 0, 0
        
        # Amount is percentage of original dimension
        pixel_amount = 0
        
        if direction == "left":
            pixel_amount = int(width * amount)
            new_width = width + pixel_amount
            offset_x = pixel_amount
        elif direction == "right":
            pixel_amount = int(width * amount)
            new_width = width + pixel_amount
        elif direction == "up":
            pixel_amount = int(height * amount)
            new_height = height + pixel_amount
            offset_y = pixel_amount
        elif direction == "down":
            pixel_amount = int(height * amount)
            new_height = height + pixel_amount

        # 3. Create new canvas
        new_img = Image.new("RGBA", (new_width, new_height), (0, 0, 0, 0))
        new_img.paste(img, (offset_x, offset_y))
        
        # 4. Create Mask (white = fill, black = keep)
        # The empty areas are transparent (alpha 0) in new_img. 
        # Flux Fill usually expects a mask where white is the area to generate.
        mask = Image.new("L", (new_width, new_height), 255) # Start white (generate everything)
        # Paste a black rectangle where the original image is (keep this area)
        mask.paste(0, (offset_x, offset_y, offset_x + width, offset_y + height))
        
        # 5. Save buffers
        img_buffer = io.BytesIO()
        new_img.save(img_buffer, format="PNG")
        img_bytes = img_buffer.getvalue()
        
        mask_buffer = io.BytesIO()
        mask.save(mask_buffer, format="PNG")
        mask_bytes = mask_buffer.getvalue()

        # 6. Upload to Fal (using data URI for simplicity here as Fal supports it, or upload to R2 first)
        # For robustness, we should upload to R2, but to avoid circular deps with storage service imports 
        # (if fal_ai.py is imported by storage.py), we'll use fal_client's built-in upload if possible, 
        # or just quick data URI. Fal client handles file inputs automatically if passed as file-like?
        # Let's use fal_client.upload_file which uploads to their temp storage.
        
        # We need to save to temp file to upload via fal_client? 
        # Or fal_client.upload(data, content_type)
        img_url = fal_client.upload(img_bytes, "image/png")
        mask_url = fal_client.upload(mask_bytes, "image/png")

        print(f"[FAL] Prepared for expansion. Img: {img_url}, Mask: {mask_url}")

        # 7. Call Flux Fill
        handler = fal_client.submit(
            "fal-ai/flux/fill",
            arguments={
                "prompt": prompt,
                "image_url": img_url,
                "mask_url": mask_url,
                "image_size": "square", # Ideally match aspect ratio of new_img
                "safety_tolerance": "2",
            },
        )

        result = handler.get()
        print(f"[FAL] Expand Result: {result}")
        
        if not result or "images" not in result or not result["images"]:
             raise Exception("No image returned from Fal.ai Expand")
            
        return result["images"][0]["url"]

    except Exception as e:
        print(f"Fal.ai Expand Error: {e}")
        raise HTTPException(status_code=500, detail=f"Expansion failed: {str(e)}")
