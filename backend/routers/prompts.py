from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from services.supabase_client import supabase
from routers.admin import verify_admin_role
from typing import List, Optional

router = APIRouter()

# ============================================
# Request Models
# ============================================

class ModelConfig(BaseModel):
    model_id: Optional[str] = None
    aspect_ratio: Optional[str] = None
    cfg: Optional[float] = None
    parameters: Optional[dict] = None

class CreatePromptRequest(BaseModel):
    title: str
    prompt: str
    negative_prompt: Optional[str] = None
    image_url: str
    prompt_model_config: Optional[ModelConfig] = Field(default=None, alias="model_config")
    category: Optional[str] = None
    tags: List[str] = []
    admin_id: str

    model_config = {"populate_by_name": True}

class GalleryItem(BaseModel):
    id: str
    title: str
    prompt: str
    negative_prompt: Optional[str] = None
    image_url: str
    prompt_model_config: Optional[dict] = Field(default=None, alias="model_config")
    category: Optional[str] = None
    tags: List[str] = []
    created_at: str

    model_config = {"populate_by_name": True}

# ============================================
# API Endpoints
# ============================================

@router.get("/prompts/gallery")
async def get_gallery(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    tag: Optional[str] = None
):
    """
    Get public curated prompts with pagination and filtering.
    """
    try:
        offset = (page - 1) * limit
        
        query = supabase.table("curated_prompts")\
            .select("*", count="exact")\
            .eq("is_active", True)
            
        if category:
            query = query.eq("category", category)
            
        if tag:
            # Contains specific tag in array
            query = query.contains("tags", [tag])
            
        # Order by created_at desc (newest first)
        response = query.order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
            
        return {
            "data": response.data,
            "count": response.count,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/prompts")
async def create_prompt(request: CreatePromptRequest):
    """
    Create a new curated prompt entry (Admin Only).
    """
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
        
    try:
        data = request.model_dump(exclude={"admin_id"}, by_alias=True)
        # Clean up model_config if it's a Pydantic model (it is)
        if hasattr(request.prompt_model_config, 'model_dump'):
             data["model_config"] = request.prompt_model_config.model_dump(exclude_none=True)

        response = supabase.table("curated_prompts").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create prompt entry")
            
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        print(f"Error creating prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdatePromptRequest(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    image_url: Optional[str] = None
    prompt_model_config: Optional[ModelConfig] = Field(default=None, alias="model_config")
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    admin_id: str

    model_config = {"populate_by_name": True}

@router.put("/admin/prompts/{prompt_id}")
async def update_prompt(prompt_id: str, request: UpdatePromptRequest):
    """
    Update an existing prompt entry (Admin Only).
    """
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")

    try:
        data = request.model_dump(exclude={"admin_id"}, exclude_unset=True, by_alias=True)
        
        # Clean up model_config if present
        if request.prompt_model_config:
             data["model_config"] = request.prompt_model_config.model_dump(exclude_none=True)
        
        if not data:
            return {"status": "success", "message": "No changes provided"}

        response = supabase.table("curated_prompts").update(data).eq("id", prompt_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Prompt not found or update failed")
            
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        print(f"Error updating prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, admin_id: str):
    """
    Hard delete a prompt entry (Admin Only).
    Alternatively, could set is_active=False for soft delete.
    """
    if not verify_admin_role(admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
        
    try:
        # Soft delete is generally safer, but if "Delete" is requested, let's just delete it for now
        # OR just set is_active=False if we want to preserve data. 
        # Given "Manage" context, usually Delete means Delete.
        response = supabase.table("curated_prompts").delete().eq("id", prompt_id).execute()
        
        # Supabase delete returns data of deleted rows
        if not response.data:
             raise HTTPException(status_code=404, detail="Prompt not found")

        return {"status": "success", "deleted_id": prompt_id}
    except Exception as e:
        print(f"Error deleting prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompts/categories")
async def get_categories():
    """
    Get list of unique categories.
    """
    try:
        # Note: Supabase JS client doesn't support .distinct() directly in some versions 
        # or requires a specific rpc properly.
        # A simpler way if data is small is to fetch distinct categories column
        # But for now, we can hardcode or distinct via python if not immense.
        # Ideally, use a postgres function. 
        # Let's try fetching all categories (assuming not millions) and unique them, or specific query.
        
        # Proper way: rpc or raw sql (if allowed).
        # Fallback: Just return predefined list if dynamic is hard without RPC.
        # Let's fetch active categories efficiently ? 
        # Actually, let's just make an RPC call if we want perf, or select categories.
        
        response = supabase.table("curated_prompts").select("category").eq("is_active", True).execute()
        categories = sorted(list(set([item['category'] for item in response.data if item['category']])))
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
