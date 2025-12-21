import os
import fal_client
from .base import AIProvider
from typing import Dict, Any, Optional, List
from utils.logger import logger
from fastapi.concurrency import run_in_threadpool

class FalProvider(AIProvider):
    def __init__(self):
        if not os.getenv("FAL_KEY"):
            logger.warning("FAL_KEY not set in environment variables")

    async def generate_image(
        self,
        prompt: str,
        model_path: str,
        aspect_ratio: str = "1:1",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None,
        resolution: Optional[str] = None,
        num_images: int = 1
    ) -> str:
        return await run_in_threadpool(
            self._generate_image_sync,
            prompt,
            model_path,
            aspect_ratio,
            references,
            parameters,
            resolution,
            num_images
        )

    def _generate_image_sync(
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

        logger.info(f"[FAL] Generating with endpoint: {endpoint}")

        # 2. Use parameters directly without "smart mapping" if present
        arguments = {
            "prompt": prompt,
            "num_images": num_images,
            "safety_tolerance": "2",
        }
        
        # If the user defines 'image_size' or 'aspect_ratio' in the parameters schema, use that.
        if aspect_ratio and "image_size" not in (parameters or {}) and "aspect_ratio" not in (parameters or {}):
             arguments["image_size"] = self._map_aspect_ratio(aspect_ratio)

        # 3. Merge user/system parameters (Prioritize these!)
        if parameters:
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

        logger.info(f"[FAL] Arguments keys: {list(arguments.keys())}")

        # 6. Submit
        try:
            handler = fal_client.submit(endpoint, arguments=arguments)
            result = handler.get()
            logger.info(f"[FAL] Result received for {endpoint}")
        except Exception as e:
            logger.error(f"[FAL] CRITICAL ERROR: {str(e)}", exc_info=True)
            raise e
        
        if not result or "images" not in result or not result["images"]:
            logger.error(f"[FAL] Unexpected result: {result}")
            raise Exception("No images returned from Fal.ai")
            
        return result["images"][0]["url"]

    async def generate_video(
        self,
        prompt: str,
        model_path: str,
        duration: str = "5s",
        aspect_ratio: str = "16:9",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        return await run_in_threadpool(
            self._generate_video_sync,
            prompt,
            model_path,
            duration,
            aspect_ratio,
            references,
            parameters
        )

    def _generate_video_sync(
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
             
        logger.info(f"[FAL] Generating video with endpoint: {endpoint}")

        arguments = {
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
        }
        
        if parameters:
            arguments.update(parameters)
            
        if references and len(references) > 0:
             arguments["image_url"] = references[0]

        try:
            handler = fal_client.submit(endpoint, arguments=arguments)
            result = handler.get()
            logger.info(f"[FAL] Video Result received for {endpoint}")
        except Exception as e:
            logger.error(f"[FAL] CRITICAL VIDEO ERROR: {str(e)}", exc_info=True)
            raise e
        
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
