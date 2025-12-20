import os
import json
import re
from openai import OpenAI
from .base import AIProvider
from typing import Dict, Any, Optional, List
from services import dns_patch # keep dns patch

class OpenRouterProvider(AIProvider):
    def __init__(self):
        key = os.getenv("OPENROUTER_API_KEY")
        if not key:
            print("Warning: OPENROUTER_API_KEY not set")
            self.client = None
        else:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=key,
                timeout=60.0,
                default_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Lovart Flow (Local Dev)",
                }
            )

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
        if not self.client:
             raise Exception("OpenRouter API Key missing")

        # 2. Trust parameters from dynamic schema
        # User request: "不需要智能映射"
        
        # Determine aspect ratio / size / resolution
        # We only apply default mapping if the user hasn't supplied a specific override in parameters
        
        # If parameters has 'resolution' or 'aspect_ratio', use it.
        # Otherwise use the passed in args.
        
        extra_body = {}
        
        if parameters:
             # Move known top-level params or dump into extra_body
             for k, v in parameters.items():
                  if k in ["seed", "temperature", "top_p"]:
                       pass 
                  else:
                       extra_body[k] = v

        # Logic: If 'aspect_ratio' is NOT in parameters (extra_body), then we might inject it from the function arg
        # But we must be careful not to override what the user configured in schema.
        
        if aspect_ratio and "aspect_ratio" not in extra_body and "resolution" not in extra_body:
             # Only if missing from schema config, we provide the legacy/frontend choice
             # OpenRouter Flux often wants it in extra_body
             extra_body["aspect_ratio"] = aspect_ratio
             
             # Also resolution
             if resolution:
                 extra_body["resolution"] = resolution
             elif "resolution" not in extra_body:
                 extra_body["resolution"] = self._map_ar_to_size(aspect_ratio)

        try:
            messages = [{"role": "user", "content": prompt}]
            
            # Construct final params
            chat_params = {
                "model": model_path,
                "messages": messages,
                "extra_body": extra_body
            }
            
            # Merge top level params from parameters
            if parameters:
                for k, v in parameters.items():
                    if k in ["seed", "temperature", "top_p"]:
                        chat_params[k] = v

            response = self.client.chat.completions.create(**chat_params)
            
            return self._extract_url_from_response(response)

        except Exception as e:
            print(f"[OPENROUTER] Generation failed: {e}")
            raise e

    def generate_video(
        self,
        prompt: str,
        model_path: str,
        duration: str = "5s",
        aspect_ratio: str = "16:9",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        # Similar fallback logic for video
        return self.generate_image(prompt, model_path, aspect_ratio, references, parameters)

    def _map_ar_to_size(self, ar: str) -> str:
        # Standard Flux resolutions approx 1MP
        m = {
            "1:1": "1024x1024",
            "16:9": "1344x768", 
            "9:16": "768x1344",
            "4:3": "1184x864", 
            "3:4": "864x1184",
        }
        return m.get(ar, "1024x1024")

    def _extract_url_from_response(self, response) -> str:
        # 1. Check specialized 'images' or 'video' fields in object
        msg = response.choices[0].message
        
        # OpenRouter Flux often returns 'images' list in the message object or model_extra
        images = getattr(msg, 'images', None)
        if not images and hasattr(msg, 'model_extra'):
             images = msg.model_extra.get('images')
             
        if images and len(images) > 0:
             # handle {url: ...} or object
             img = images[0]
             if isinstance(img, dict): return img.get("url")
             if hasattr(img, "url"): return img.url
             
        # 2. Check content for Markdown or URL
        content = msg.content
        if not content:
             raise Exception("Empty response content from OpenRouter")
             
        # Regex for valid URL
        url_match = re.search(r'https?://[^\s<>"]+', content)
        if url_match:
             return url_match.group(0)
             
        raise Exception("Could not find media URL in OpenRouter response")
