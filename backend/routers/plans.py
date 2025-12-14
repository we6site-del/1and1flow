from fastapi import APIRouter, HTTPException, Query, Body
from services.supabase_client import supabase
from pydantic import BaseModel
from typing import List, Optional, Any
import json
from data.default_plans import DEFAULT_PLANS

router = APIRouter()

class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: float
    credits_monthly: int
    features: List[str]
    is_active: bool = True
    is_popular: bool = False
    tier_level: int

class PlanCreate(PlanBase):
    pass

class PlanUpdate(PlanBase):
    pass

@router.get("/plans")
def get_plans(active_only: bool = True):
    try:
        query = supabase.table("subscription_plans").select("*").order("tier_level")
        if active_only:
            query = query.eq("is_active", True)
        
        response = query.execute()
        return response.data
    except Exception as e:
        print(f"Error fetching plans: {e}")
        # Fallback for development if table doesn't exist yet
        # Fallback for development if table doesn't exist yet
        return DEFAULT_PLANS

@router.post("/plans")
def create_plan(plan: PlanCreate):
    try:
        response = supabase.table("subscription_plans").insert(plan.dict()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/plans/{plan_id}")
def update_plan(plan_id: str, plan: PlanUpdate):
    try:
        response = supabase.table("subscription_plans").update(plan.dict()).eq("id", plan_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str):
    try:
        supabase.table("subscription_plans").delete().eq("id", plan_id).execute()
        return {"message": "Plan deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
