from fastapi import APIRouter, HTTPException, Query, Depends
from services.supabase_client import supabase
from utils.auth import get_current_user
from utils.logger import get_logger
import json
import time

router = APIRouter()
logger = get_logger(__name__)

@router.get("/projects")
def get_projects(current_user: dict = Depends(get_current_user)):
    user_id = current_user.id
    try:
        # Fetch projects from Supabase
        # Optimized: Fetch thumbnail_url directly instead of heavy canvas_data
        # Add retry logic for transient connection errors
        max_retries = 3
        response = None
        last_error = None
        
        for i in range(max_retries):
            try:
                response = supabase.table("projects").select("id, name, updated_at, thumbnail_url").eq("user_id", user_id).order("updated_at", desc=True).limit(20).execute()
                break
            except Exception as e:
                last_error = e
                if i < max_retries - 1:
                    time.sleep(0.5 * (i + 1))  # Exponential backoff
                else:
                    logger.error(f"Failed to fetch projects after retries: {e}")
                    raise e
        
        if not response:
            logger.warning(f"No response from Supabase for user {user_id}")
            return []
            
        projects_data = response.data
        
        # 1. Identify projects missing thumbnails
        missing_thumbnail_ids = [p["id"] for p in projects_data if not p.get("thumbnail_url")]
        
        # 2. Batch fetch latest generations for these projects
        generations_map = {}
        if missing_thumbnail_ids:
            try:
                # A. Try fetching from generations table first
                gen_response = supabase.table("generations")\
                    .select("project_id, result_url")\
                    .in_("project_id", missing_thumbnail_ids)\
                    .eq("status", "COMPLETED")\
                    .order("created_at", desc=True)\
                    .execute()
                
                for gen in gen_response.data:
                    pid = gen["project_id"]
                    if pid not in generations_map and gen.get("result_url"):
                        generations_map[pid] = gen["result_url"]
                
                # B. Canvas data parsing removed for performance
                # Fetching canvas_data is too heavy for the list endpoint and causes timeouts.
                # If thumbnail is missing in projects and generations tables, we will show a placeholder.

            except Exception as e:
                logger.error(f"Error resolving thumbnails: {e}")

        projects = []
        for item in projects_data:
            thumbnail_url = item.get("thumbnail_url")
            
            # Use fallback if needed
            if not thumbnail_url and item["id"] in generations_map:
                thumbnail_url = generations_map[item["id"]]
            
            media_type = None
            
            # Infer media type from URL extension if thumbnail exists
            if thumbnail_url:
                ext = thumbnail_url.split('.')[-1].lower() if '.' in thumbnail_url else ""
                if ext in ['mp4', 'mov', 'webm']:
                    media_type = "video"
                else:
                    media_type = "image"

            projects.append({
                "id": item["id"],
                "name": item["name"] or "Untitled",
                "updated_at": item["updated_at"],
                "thumbnail_url": thumbnail_url,
                "media_type": media_type
            })
            
        return projects

    except Exception as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}")
def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.id
    try:
        # Verify project belongs to user
        project = supabase.table("projects").select("id").eq("id", project_id).eq("user_id", user_id).execute()
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found or access denied")

        # Delete project
        supabase.table("projects").delete().eq("id", project_id).execute()
        return {"message": "Project deleted successfully"}

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))
