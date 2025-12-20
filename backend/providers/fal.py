import os
import fal_client
from .base import AIProvider
from typing import Dict, Any, Optional, List

class FalProvider(AIProvider):
    def __init__(self):
        if not os.getenv("FAL_KEY"):
            print("Warning: FAL_KEY not set in environment variables")

    def generate_image(
        self,
        prompt: str,
        model_path: str,
        aspect_ratio: str = "1:1",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None,
        resolution: Optional[str] = None,
        num_images: int = 1
    ) -> str:
        
        # 1. Determine endpoint
        endpoint = model_path
        if "/" not in model_path:
            # Legacy mapping
            if model_path == "flux-dev":
                endpoint = "fal-ai/flux/dev"
            else:
                endpoint = "fal-ai/flux-pro/v1.1"

        print(f"[FAL] Generatiing with endpoint: {endpoint}")

        # 2. Use parameters directly without "smart mapping" if present
        # User requested: "不需要智能映射 我意思参数能够正常input给模型"
        arguments = {
            "prompt": prompt,
            "num_images": num_images,
            "safety_tolerance": "2",
        }
        
        # If the user defines 'image_size' or 'aspect_ratio' in the parameters schema, use that.
        # Otherwise, fallback to the legacy `aspect_ratio` passed from frontend only if not in params.
        
        if aspect_ratio and "image_size" not in (parameters or {}) and "aspect_ratio" not in (parameters or {}):
             # Minimal buffer: If frontend sends "9:16" and user hasn't configured a specific param,
             # we might need to send SOMETHING valid to Fal if the model strict.
             # However, user asked to disable smart mapping. 
             # We will pass 'image_size' = aspect_ratio ONLY if the user hasn't provided it.
             # But Fal usually needs specific enums.
             # Compromise: We map ONLY if the value is clearly a legacy frontend value (e.g. 16:9),
             # BUT if parameters has anything, we trust parameters completely.
             arguments["image_size"] = self._map_aspect_ratio(aspect_ratio)

        # 3. Merge user/system parameters (Prioritize these!)
        if parameters:
            # Direct update - blindly trust the schema editor configuration
            arguments.update(parameters)

        # Override with explicit resolution if provided (format "WxH")
        if resolution and "x" in resolution and "image_size" not in arguments:
             try:
                 w, h = map(int, resolution.split("x"))
                 arguments["image_size"] = { "width": w, "height": h }
             except:
                 pass

        # 5. Handle References
        if references and len(references) > 0:
            if "nano-banana" in model_path: # Specific model requirement example
               arguments["image_urls"] = references[:3]
            else:
                arguments["image_url"] = references[0]

        print(f"[FAL] Arguments: {arguments}")

        # 6. Submit
        handler = fal_client.submit(endpoint, arguments=arguments)
        result = handler.get()
        
        print(f"[FAL] Result: {result}")

        if not result or "images" not in result or not result["images"]:
            raise Exception("No images returned from Fal.ai")
            
        return result["images"][0]["url"]

    def generate_video(
        self,
        prompt: str,
        model_path: str,
        duration: str = "5s",
        aspect_ratio: str = "16:9",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        
        endpoint = model_path
        # Legacy fallback
        if "hunyuan" in model_path and "/" not in model_path:
             endpoint = "fal-ai/hunyuan-video"
             
        print(f"[FAL] Generatiing video with endpoint: {endpoint}")

        arguments = {
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": aspect_ratio, # Many video models take aspect_ratio directly
        }
        
        if parameters:
            arguments.update(parameters)
            
        if references and len(references) > 0:
             arguments["image_url"] = references[0]

        handler = fal_client.submit(endpoint, arguments=arguments)
        result = handler.get()
        print(f"[FAL] Video Result: {result}")
        
        if "video" in result:
             return result["video"]["url"]
        return result.get("url", "")

    def _map_aspect_ratio(self, ar: str) -> str:
        """Map standard AR string to Fal image_size enum."""
        mapping = {
            "1:1": "square_hd", # Prefer HD
            "16:9": "landscape_16_9",
            "9:16": "portrait_16_9",
            "4:3": "landscape_4_3",
            "3:4": "portrait_4_3",
            "21:9": "landscape_16_9", # Fallback
        }
        return mapping.get(ar, "square_hd")

    def _normalize_fal_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Pass through parameters directly."""
        return params
