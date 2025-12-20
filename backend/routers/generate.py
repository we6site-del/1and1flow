from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.supabase_client import supabase
import time
import uuid
from utils.logger import logger
from typing import Optional

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    user_id: str
    node_id: str
    project_id: str | None = None
    model_id: str | None = None  # New: UUID of model from ai_models table
    model: str | None = None  # Legacy: model identifier string (for backward compatibility)
    type: str = "image"  # "image" | "video"
    parameters: dict | None = None  # New: Dynamic parameters from schema
    aspect_ratio: str | None = None  # Legacy: for backward compatibility
    duration: str | None = None  # Legacy: for backward compatibility
    references: list[str] | None = None  # Reference image URLs
    resolution: str | None = None # New: Explicit resolution (e.g. "1024x1024")
    num_images: int = 1 # New: Number of images to generate

from services import fal_ai, storage, replicate_service, openrouter_service

def process_generation_task(
    generation_id: str, 
    prompt: str, 
    type: str, 
    model_id: str | None,
    model: str | None,
    parameters: dict | None,
    aspect_ratio: str | None, 
    duration: str | None,
    references: list[str] | None,
    resolution: str | None,
    num_images: int
):
    """
    Executes AI generation using Unified Provider Architecture.
    """
    from providers.factory import ProviderFactory

    try:
        logger.info(f"--- Processing Generation Task {generation_id} ---")
        
        # 1. Fetch Model Config
        model_config = None
        if model_id:
            model_response = supabase.table("ai_models").select("*").eq("id", model_id).eq("is_active", True).execute()
            if model_response.data:
                model_config = model_response.data[0]
                # Prioritize DB api_path over payload model
                if model_config.get("api_path"):
                    model = model_config.get("api_path")

        provider_name = model_config.get("provider", "FAL") if model_config else "FAL"
        
        # Legacy: Detect Replicate hardcoded models if not in DB
        if not model_config and ("kling" in str(model) or "veo" in str(model)) and "fal" not in str(model):
             provider_name = "REPLICATE"

        logger.info(f"Using Provider: {provider_name} for model: {model}")

        # 2. Get Provider
        provider = ProviderFactory.get_provider(provider_name)
        
        # 3. Resolve Parameters (Legacy + Dynamic)
        final_ar = aspect_ratio
        if parameters and "aspect_ratio" in parameters:
             final_ar = parameters["aspect_ratio"]
        if not final_ar:
             final_ar = "1:1" if type == "image" else "16:9"

        # 4. Generate
        temp_url = ""
        if type == "video":
            temp_url = provider.generate_video(
                prompt=prompt,
                model_path=model,
                duration=duration or "5s",
                aspect_ratio=final_ar,
                references=references,
                parameters=parameters
            )
        else:
            temp_url = provider.generate_image(
                prompt=prompt,
                model_path=model,
                aspect_ratio=final_ar,
                references=references,
                parameters=parameters,
                resolution=resolution,
                num_images=num_images
            )
            
        logger.info(f"Generation successful. Temp URL: {temp_url}")

        # 5. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        logger.info(f"Upload successful. Final URL: {final_url}")
        
        # 6. Update Database
        supabase.table("generations").update({
            "status": "COMPLETED",
            "result_url": final_url
        }).eq("id", generation_id).execute()
        
        logger.info(f"Task {generation_id} Completed.")

    except Exception as e:
        logger.error(f"Generation {generation_id} failed: {e}", exc_info=True)
        supabase.table("generations").update({
            "status": "FAILED"
        }).eq("id", generation_id).execute()

@router.post("/generate")
async def generate_image(request: GenerateRequest, background_tasks: BackgroundTasks):
    try:
        with open("debug_gen.log", "a") as f:
            f.write(f"\n[{time.strftime('%X')}] API: Received /generate request\n")
            f.write(f"User: {request.user_id}, Prompt: {request.prompt[:50]}..., Model ID: {request.model_id}\n")

        # 1. Fetch model configuration to determine cost
        cost = 4  # Default cost
        model_config = None
        
        if request.model_id:
            # Fetch from database
            # Try api_path first (for legacy string IDs like "flux-pro"), then fallback to UUID
            model_response = supabase.table("ai_models").select("cost_per_gen, api_path, provider").eq("api_path", request.model_id).eq("is_active", True).execute()
            
            # If not found by api_path, try by UUID (id)
            if not model_response.data or len(model_response.data) == 0:
                model_response = supabase.table("ai_models").select("cost_per_gen, api_path, provider").eq("id", request.model_id).eq("is_active", True).execute()
            
            if model_response.data and len(model_response.data) > 0:
                model_config = model_response.data[0]
                cost = model_config.get("cost_per_gen", cost)
                # Update model to use api_path if available (Prioritize DB config over frontend legacy string)
                if model_config.get("api_path"):
                    request.model = model_config.get("api_path")
        elif request.model:
            # Legacy: use hardcoded costs based on model name
            if request.type == "video":
                cost = 160
            else:
                cost = 4

        # 2. Deduct Credits
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": cost
            }).execute()
            with open("debug_gen.log", "a") as f: f.write(f"credits deducted: {cost}\n")
        except Exception as e:
            with open("debug_gen.log", "a") as f: f.write(f"CREDIT ERROR: {str(e)}\n")
            raise HTTPException(status_code=402, detail=f"Insufficient credits or error: {str(e)}")

        # 3. Create Generation Record with Slug
        from slugify import slugify
        
        # Generate slug: first 10 words + short UUID
        short_prompt = " ".join(request.prompt.split()[:10])
        base_slug = slugify(short_prompt)
        # Append random 6 char suffix for uniqueness
        suffix = str(uuid.uuid4())[:6]
        slug = f"{base_slug}-{suffix}"
        
        generation_data = {
            "user_id": request.user_id,
            "project_id": request.project_id,
            "node_id": request.node_id,
            "prompt": request.prompt,
            "status": "PENDING",
            "slug": slug
        }
        
        response = supabase.table("generations").insert(generation_data).execute()
        
        with open("debug_gen.log", "a") as f: f.write(f"DB Insert Response: {response.data}\n")
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create generation record")
            
        generation_id = response.data[0]['id']

        # 4. Start Background Task (Real AI Generation)
        background_tasks.add_task(
            process_generation_task, 
            generation_id, 
            request.prompt, 
            request.type, 
            request.model_id,
            request.model, 
            request.parameters or {},
            request.aspect_ratio, 
            request.duration,
            request.references or [],
            request.resolution,
            request.num_images
        )

        return {"status": "pending", "generation_id": generation_id, "slug": slug}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/generations/slug/{slug}")
async def get_generation_by_slug(slug: str):
    """
    Get public generation details by slug for SEO/Explore pages.
    """
    try:
        response = supabase.table("generations").select("*, profiles(username, avatar_url)").eq("slug", slug).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Generation not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/generations/sitemap")
async def get_generations_sitemap(limit: int = 5000):
    """
    Get top public generations for sitemap.
    """
    try:
        # Fetch completed generations, ordered by created_at desc
        response = supabase.table("generations")\
            .select("slug, created_at")\
            .eq("status", "COMPLETED")\
            .not_.is_("slug", "null")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
            
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def get_models(type: Optional[str] = None):
    """
    Get available AI models (Image, Video, Chat) from Supabase.
    """
    try:
        query = supabase.table("ai_models").select("*").eq("is_active", True)
        
        if type:
            query = query.eq("type", type.upper())
            
        response = query.execute()
        
        models = response.data
        
        # Sort by type (Chat -> Image -> Video) then by name
        # Custom logic if needed
        
        return {"models": models}
    except Exception as e:
        logger.error(f"Error fetching models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ImageProcessRequest(BaseModel):
    image_url: str
    user_id: str
    project_id: str | None = None
    scale: int = 2 # Default to 2x (2k ish)

@router.post("/generate/upscale")
async def upscale_image_endpoint(request: ImageProcessRequest):
    try:
        # 1. Deduct Credits (e.g., 2 credits for 2x, 4 for 4x, 8 for 8x?)
        # Let's keep it simple: 2 credits for any upscale for now, or scale * 1
        cost = 2
        if request.scale > 2:
            cost = 4 # Higher cost for 4x/8x
        
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": cost
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: {str(e)}")

        # 2. Call AI Service (Fal.ai preferred over Replicate for reliability)
        # temp_url = replicate_service.upscale_image(request.image_url)
        temp_url = fal_ai.upscale_image(request.image_url, scale=request.scale)
        
        # 3. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        
        return {"url": final_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/remove-background")
async def remove_background_endpoint(request: ImageProcessRequest):
    try:
        # 1. Deduct Credits (e.g., 1 credit for remove bg)
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": 1
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: {str(e)}")

        # 2. Call AI Service (Replicate)
        temp_url = replicate_service.remove_background(request.image_url)
        
        # 3. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        
        return {"url": final_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InpaintRequest(BaseModel):
    image_url: str
    mask_url: str
    prompt: str
    user_id: str
    project_id: str | None = None

@router.post("/generate/inpaint")
async def inpaint_image_endpoint(request: InpaintRequest):
    try:
        # 1. Deduct Credits (e.g., 4 credits for flux fill)
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": 4
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: {str(e)}")

        # 2. Call AI Service
        temp_url = await fal_ai.inpaint_image(request.image_url, request.mask_url, request.prompt)
        
        # 3. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        
        return {"url": final_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EditRequest(BaseModel):
    image_url: str
    prompt: str
    strength: float = 0.75
    user_id: str
    project_id: str | None = None

@router.post("/generate/edit")
async def edit_image_endpoint(request: EditRequest):
    try:
        # 1. Deduct Credits (e.g., 4 credits for flux dev)
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": 4
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: {str(e)}")

        # 2. Call AI Service
        temp_url = await fal_ai.edit_image(request.image_url, request.prompt, request.strength)
        
        # 3. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        
        return {"url": final_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import UploadFile, File

@router.post("/upload/mask")
async def upload_mask(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        from fastapi.concurrency import run_in_threadpool
        url = await run_in_threadpool(storage.upload_bytes_to_r2, contents, file.content_type, folder="masks")
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """
    Upload user avatar to R2 storage.
    Returns the public URL of the uploaded avatar.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (max 5MB)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Upload to R2 in avatars folder
        from fastapi.concurrency import run_in_threadpool
        url = await run_in_threadpool(storage.upload_bytes_to_r2, contents, file.content_type, folder="avatars")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Generic image upload to R2 storage (for chat input, etc.).
    Returns the public URL of the uploaded image.
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (max 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Upload to R2 in uploads folder
        url = storage.upload_bytes_to_r2(contents, file.content_type, folder="uploads")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/media")
async def upload_media(file: UploadFile = File(...)):
    """
    Generic media upload (image or video) to R2 storage.
    Returns the public URL of the uploaded file.
    """
    try:
        # Validate file type
        if not file.content_type or (not file.content_type.startswith('image/') and not file.content_type.startswith('video/')):
            raise HTTPException(status_code=400, detail="File must be an image or video")
        
        # Validate file size (max 50MB for videos)
        contents = await file.read()
        max_size = 50 * 1024 * 1024 if file.content_type.startswith('video/') else 10 * 1024 * 1024
        
        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail=f"File size must be less than {max_size // (1024*1024)}MB")
        
        # Upload to R2 in uploads folder
        url = storage.upload_bytes_to_r2(contents, file.content_type, folder="uploads")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

class MockupRequest(BaseModel):
    image_url: str
    prompt: str
    user_id: str
    project_id: str | None = None

@router.post("/generate/mockup")
async def mockup_image_endpoint(request: MockupRequest):
    try:
        # 1. Deduct Credits (e.g., 4 credits for flux dev)
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": 4
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: {str(e)}")

        # 2. Call AI Service
        temp_url = fal_ai.generate_mockup(request.image_url, request.prompt)
        
        # 3. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        
        return {"url": final_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExpandRequest(BaseModel):
    image_url: str
    prompt: str
    direction: str = "right" # left, right, up, down
    amount: float = 0.5 # 0.25, 0.5, 1.0 (percent of dimension)
    user_id: str
    project_id: str | None = None

@router.post("/generate/expand")
async def expand_image_endpoint(request: ExpandRequest):
    try:
        # 1. Deduct Credits (e.g., 4 credits for flux fill)
        try:
            supabase.rpc("deduct_user_credits", {
                "user_uuid": request.user_id,
                "amount_to_deduct": 4
            }).execute()
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Insufficient credits: {str(e)}")

        # 2. Call AI Service
        temp_url = fal_ai.expand_image(request.image_url, request.prompt, request.direction, request.amount)
        
        # 3. Upload to R2
        final_url = storage.upload_to_r2(temp_url)
        
        return {"url": final_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
