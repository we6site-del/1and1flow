import os
import json
import re
from openai import AsyncOpenAI
from .base import AIProvider
from typing import Dict, Any, Optional, List
from utils.logger import logger
from services import dns_patch # keep dns patch

class OpenRouterProvider(AIProvider):
    def __init__(self):
        key = os.getenv("OPENROUTER_API_KEY")
        if not key:
            logger.warning("OPENROUTER_API_KEY not set")
            self.client = None
        else:
            self.client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=key,
                timeout=60.0,
                default_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Lovart Flow (Local Dev)",
                }
            )

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
        if not self.client:
             raise Exception("OpenRouter API Key missing")
        
        extra_body = {}
        
        if parameters:
             for k, v in parameters.items():
                  if k in ["seed", "temperature", "top_p"]:
                       pass 
                  else:
                       extra_body[k] = v

        if aspect_ratio and "aspect_ratio" not in extra_body and "resolution" not in extra_body:
             extra_body["aspect_ratio"] = aspect_ratio
             
             if resolution:
                 extra_body["resolution"] = resolution
             elif "resolution" not in extra_body:
                 extra_body["resolution"] = self._map_ar_to_size(aspect_ratio)

        try:
            messages = [{"role": "user", "content": prompt}]
            
            chat_params = {
                "model": model_path,
                "messages": messages,
                "extra_body": extra_body
            }
            
            if parameters:
                for k, v in parameters.items():
                    if k in ["seed", "temperature", "top_p"]:
                        chat_params[k] = v

            logger.info(f"[OPENROUTER] Generating {model_path} with extra_body keys: {list(extra_body.keys())}")
            
            response = await self.client.chat.completions.create(**chat_params)
            
            return self._extract_url_from_response(response)

        except Exception as e:
            logger.error(f"[OPENROUTER] Generation failed: {e}", exc_info=True)
            raise e

    async def generate_video(
        self,
        prompt: str,
        model_path: str,
        duration: str = "5s",
        aspect_ratio: str = "16:9",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        # Fallback to image generation path for now as OpenRouter video support varies
        return await self.generate_image(prompt, model_path, aspect_ratio, references, parameters)

    def _map_ar_to_size(self, ar: str) -> str:
        m = {
            "1:1": "1024x1024",
            "16:9": "1344x768", 
            "9:16": "768x1344",
            "4:3": "1184x864", 
            "3:4": "864x1184",
        }
        return m.get(ar, "1024x1024")

    def _extract_url_from_response(self, response) -> str:
        msg = response.choices[0].message
        
        # Check specialized 'images' or 'video' fields
        images = getattr(msg, 'images', None)
        if not images and hasattr(msg, 'model_extra'):
             images = msg.model_extra.get('images')
             
        if images and len(images) > 0:
             img = images[0]
             if isinstance(img, dict): return img.get("url")
             if hasattr(img, "url"): return img.url
             
        # Check content for Markdown regex
        content = msg.content
        if not content:
             raise Exception("Empty response content from OpenRouter")
             
        url_match = re.search(r'https?://[^\s<>"]+', content)
        if url_match:
             return url_match.group(0)
             
        raise Exception("Could not find media URL in OpenRouter response")
