from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import supabase
from routers.admin import verify_admin_role, log_admin_action
from typing import Any

router = APIRouter()

class SettingUpdate(BaseModel):
    key: str
    value: Any
    description: str | None = None
    admin_id: str

@router.get("/admin/settings")
async def get_settings():
    """
    Get all system settings.
    """
    try:
        response = supabase.table("system_settings").select("*").execute()
        # Convert list to dict for easier frontend consumption
        settings = {item['key']: item['value'] for item in response.data}
        return {
            "status": "success",
            "data": response.data,
            "settings": settings # Convenience format
        }
    except Exception as e:
        print(f"Error fetching settings: {e}")
        # Return default if table doesn't exist yet or fails
        return {
            "status": "error",
            "message": str(e),
            "settings": {"payment_methods": ["card"]} 
        }

@router.post("/admin/settings")
@log_admin_action(action_type="update_setting", resource_type="system_setting")
async def update_setting(request: SettingUpdate):
    """
    Update a specific system setting.
    """
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        data = {
            "key": request.key,
            "value": request.value,
            "updated_by": request.admin_id
        }
        if request.description:
            data["description"] = request.description

        response = supabase.table("system_settings").upsert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update setting")

        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        print(f"Error updating setting: {e}")
        raise HTTPException(status_code=500, detail=str(e))
