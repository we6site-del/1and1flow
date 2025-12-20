import os
import replicate
from .base import AIProvider
from typing import Dict, Any, Optional, List
from fastapi import HTTPException

class ReplicateProvider(AIProvider):
    def __init__(self):
        token = os.getenv("REPLICATE_API_TOKEN")
        if not token:
            print("Warning: REPLICATE_API_TOKEN not set")
        self.client = replicate.Client(api_token=token)

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
        
        input_params = {"prompt": prompt}
        
        # Determine aspect ratio handling
        # Replicate models are diverse. standard Flux on Replicate takes `aspect_ratio` string.
        # SDXL takes `width` and `height`.
        if "flux" in model_path.lower():
             input_params["aspect_ratio"] = aspect_ratio
        else:
             # Default fallback for others, might be ignored if not supported
             input_params["aspect_ratio"] = aspect_ratio

        if parameters:
            input_params.update(parameters)
            
        if references:
            input_params["image"] = references[0]

        return self._run_replicate(model_path, input_params)

    def generate_video(
        self,
        prompt: str,
        model_path: str,
        duration: str = "5s",
        aspect_ratio: str = "16:9",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        
        input_params = {"prompt": prompt}
        
        # Handle Duration
        if duration:
             # "5s" -> 5
             try:
                 sec = int(duration.replace("s", ""))
                 input_params["duration"] = sec
             except:
                 pass
        
        if aspect_ratio:
             input_params["aspect_ratio"] = aspect_ratio

        if parameters:
            input_params.update(parameters)
            
        if references:
             # Kling/Gen-3 patterns
             if len(references) >= 2:
                  input_params["start_image"] = references[0]
                  input_params["end_image"] = references[1]
             else:
                  input_params["image"] = references[0] # or "input_image"

        return self._run_replicate(model_path, input_params)

    def _run_replicate(self, model: str, inputs: Dict[str, Any]) -> str:
        print(f"[REPLICATE] Running {model} with inputs: {inputs}")
        try:
            output = self.client.run(model, input=inputs)
            
            # Unpack Output
            if isinstance(output, str):
                return output
            elif isinstance(output, list) and len(output) > 0:
                return output[0] if isinstance(output[0], str) else output[0].get("url", str(output[0]))
            elif isinstance(output, dict):
                 if "url" in output: return output["url"]
                 if "video" in output: return output["video"]
                 if "output" in output: return output["output"]
            
            raise Exception(f"Unknown output format: {type(output)}")
            
        except Exception as e:
            print(f"[REPLICATE] Error: {e}")
            raise HTTPException(status_code=500, detail=f"Replicate error: {str(e)}")
