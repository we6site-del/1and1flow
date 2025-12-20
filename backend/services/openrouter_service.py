from openai import OpenAI
import os
import time

import httpx

# Patch DNS for OpenRouter to bypass local proxy issues
from services import dns_patch

openrouter_key = os.getenv("OPENROUTER_API_KEY")


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_key,
    timeout=60.0, 
    default_headers={
        "HTTP-Referer": "http://localhost:3000", # Optional, for including your app on openrouter.ai rankings.
        "X-Title": "Lovart Flow (Local Dev)", # Optional. Shows in rankings on openrouter.ai.
    }
) if openrouter_key else None

def generate_image(prompt, model, aspect_ratio="1:1", extra_params=None, num_images=1):
    with open("debug_gen.log", "a") as f:
        f.write(f"[{time.strftime('%X')}] Service: generate_image called with model={model}, n={num_images}\n")
    if not client:
        with open("debug_gen.log", "a") as f: f.write("ERROR: Client is None (Key missing)\n")
        raise Exception("OpenRouter API key not configured")
    
    print(f"DEBUG: openrouter_service.generate_image called with model={model}")

    # Map aspect ratio to Flux-friendly resolutions (approx 1MP)
    # References: OpenRouter Flux docs / community benchmarks
    size_map = {
        "1:1": "1024x1024",
        "16:9": "1344x768", 
        "9:16": "768x1344",
        "4:3": "1184x864", 
        "3:4": "864x1184",
        "2:3": "832x1248",
        "3:2": "1248x832",
        "21:9": "1536x640" 
    }
    
    size = size_map.get(aspect_ratio, "1024x1024")

    print(f"DEBUG: OpenRouter Image Gen. Model: {model}, Size: {size}")

    # Method 1: Try Standard OpenAI Image API (often 405 for Flux on OpenRouter)
    try:
        api_params = {
            "model": model,
            "prompt": prompt,
            "size": size,
            "n": num_images,
        }
        if extra_params:
             api_params["extra_body"] = extra_params
            
        print(f"DEBUG: Calling Images API with params: {api_params}")
        response = client.images.generate(**api_params)
        
        if response.data:
             return response.data[0].url
    except Exception as img_err:
        with open("debug_gen.log", "a") as f: f.write(f"DEBUG: Standard Image API failed: {img_err}\n")
        print(f"DEBUG: Standard Image API failed ({img_err}), trying Chat API fallback...")
        pass # Fall through to Chat method

    # Method 2: Fallback to Chat Completions (for Flux, etc.)
    try:
        # Construct message content
        # Do NOT use --ar (MJ style). Use natural language or extra_body.
        prompt_in_msg = prompt
        
        # Flux usually works best with resolution in request body, but for Chat API, 
        # specifying it in prompt as "aspect ratio X:Y" is a safe backup.
        # We also pass it in extra_body below.
        
        messages = [{"role": "user", "content": prompt_in_msg}]
        
        chat_params = {
            "model": model,
            "messages": messages,
            # Pass extra parameters here for OpenRouter
            "extra_body": {} 
        }

        # 1. Pass aspect_ratio/resolution in extra_body (preferred by some OpenRouter providers)
        if aspect_ratio:
            chat_params["extra_body"]["aspect_ratio"] = aspect_ratio
            chat_params["extra_body"]["resolution"] = size # Some might prefer resolution
            
        # 2. Pass other extra_params
        if extra_params:
             if "style" in extra_params:
                 messages[0]["content"] += f" in style {extra_params['style']}"
             
             # Merge other params into extra_body
             valid_chat_params = ["temperature", "top_p", "seed", "max_tokens"]
             for k, v in extra_params.items():
                 if k in valid_chat_params:
                     chat_params[k] = v
                 else:
                     chat_params["extra_body"][k] = v

        response = client.chat.completions.create(**chat_params)
        
        # Truncate raw response logging to avoid massive base64 dumps
        response_str = str(response)
        if len(response_str) > 1000:
            response_str = response_str[:1000] + "... [TRUNCATED]"
        
        with open("debug_gen.log", "a") as f: f.write(f"DEBUG: RAW CHAT RESPONSE (Truncated): {response_str}\n")
        print(f"DEBUG: RAW RESPONSE (Truncated): {response_str}")

        content = response.choices[0].message.content
        msg_obj = response.choices[0].message
        
        # Check for structured images field (seen in OpenRouter/Flux responses)
        # Verify if 'images' attribute exists on the message object
        images = getattr(msg_obj, 'images', None)
        
        # Fallback to model_extra if direct attribute access fails
        if not images and hasattr(msg_obj, 'model_extra') and msg_obj.model_extra:
             images = msg_obj.model_extra.get('images')

        if images:
            with open("debug_gen.log", "a") as f:
                f.write(f"DEBUG: Found images in response: Len: {len(images)}\n")
            
            if len(images) > 0:
                img_item = images[0]
                url = None
                
                # Try object access
                if hasattr(img_item, 'image_url'):
                     img_url_obj = img_item.image_url
                     if hasattr(img_url_obj, 'url'):
                         url = img_url_obj.url
                     elif isinstance(img_url_obj, dict) and 'url' in img_url_obj:
                         url = img_url_obj['url']
                
                # Try dict access
                elif isinstance(img_item, dict):
                    if 'image_url' in img_item:
                        img_url_obj = img_item['image_url']
                        if isinstance(img_url_obj, dict) and 'url' in img_url_obj:
                            url = img_url_obj['url']
                        elif hasattr(img_url_obj, 'url'):
                            url = img_url_obj.url
                    # Direct url field
                    elif 'url' in img_item:
                        url = img_item['url']

                if url:
                    # Log the URL type but not the full content if it is data URI
                    if url.startswith("data:"):
                         preview = url[:50] + "..."
                         print(f"DEBUG: Found Data URI in response: {preview}")
                         with open("debug_gen.log", "a") as f: f.write(f"DEBUG: Found Data URI: {preview}\n")
                    else:
                         print(f"DEBUG: Found Image URL: {url}")
                    # CRITICAL: Return the URL immediately
                    return url
        
        if not content:
             raise Exception("No content in response")
             
        print(f"DEBUG: OpenRouter Chat Response for Image: {content[:100]}...")
        
        # Extract Image URL
        # 1. Check for data URI first (base64 images)
        import re
        data_uri_match = re.search(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+', content)
        if data_uri_match:
            url = data_uri_match.group(0)
            print(f"DEBUG: Found data URI in content: {url[:50]}...")
            return url
        
        # 2. Regex for markdown image: ![...](url)
        img_match = re.search(r'!\[.*?\]\((.*?)\)', content)
        if img_match:
            return img_match.group(1)
            
        # 3. Regex for direct URL
        url_match = re.search(r'https?://[^\s<>"]+|www\.[^\s<>"]+', content)
        if url_match:
             # Filter out some common non-image URLs if mostly text? 
             # For now assume the first URL is the result if it looks like an asset
             return url_match.group(0)

        # 4. JSON check
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
             import json
             json_data = json.loads(match.group(0))
             if "url" in json_data: return json_data["url"]
             if "image_url" in json_data: return json_data["image_url"]

        raise Exception("Could not find image URL in chat response")

    except Exception as chat_err:
        print(f"OpenRouter Image Gen Error (Both methods failed): {chat_err}")
        # Raise the original error if it was more relevant, or the chat error
        raise chat_err

def generate_video(prompt, model, duration="5s", aspect_ratio="16:9", extra_params=None):
    """
    Experimental support for video generation via OpenRouter.
    Since there is no standard OpenAI Video API, we assume the model accepts a prompt via Chat Completions
    and returns a video URL or meaningful response.
    """
    if not client:
        raise Exception("OpenRouter API key not configured")

    try:
        print(f"DEBUG: OpenRouter Video Generation (Experimental). Model: {model}")
        
        # Try sending as a chat completion (standard for Text-to-Video models on some gateways)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            # max_tokens might be needed?
        )
        
        content = response.choices[0].message.content
        if not content:
            raise Exception("No content in response")
            
        print(f"DEBUG: OpenRouter Response Content: {content[:100]}...")
        
        # Simple heuristic: Check if content looks like a URL
        if content.startswith("http") and ("mp4" in content or "mov" in content or "url" in content):
             return content.strip()
        
        # If it's a JSON string, try to parse it
        import json
        try:
             import re
             # Extract JSON block if present
             match = re.search(r'\{.*\}', content, re.DOTALL)
             if match:
                 json_data = json.loads(match.group(0))
                 if "url" in json_data:
                     return json_data["url"]
                 if "video" in json_data:
                     return json_data["video"]
        except:
             pass

        # If we just got text and no clear URL, it might have failed or the model is chat-only.
        # But we return the content as a fallback, though process_generation expects a URL.
        # If it's not a URL, the upload_to_r2 might fail, but that's better than hard crash.
        return content

    except Exception as e:
        print(f"OpenRouter Video Gen Error: {e}")
        raise e
