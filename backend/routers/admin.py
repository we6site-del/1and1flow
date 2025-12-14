from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import supabase
from functools import wraps

router = APIRouter()

# ============================================
# Request Models
# ============================================

class GiftCreditsRequest(BaseModel):
    user_id: str
    amount: int
    reason: str
    admin_id: str

class RefundTransactionRequest(BaseModel):
    transaction_id: str
    reason: str
    admin_id: str

class BanUserRequest(BaseModel):
    user_id: str
    banned: bool
    reason: str
    admin_id: str

class AddModelRequest(BaseModel):
    name: str
    type: str # IMAGE, VIDEO, CHAT
    provider: str # REPLICATE, FAL, OPENAI, CUSTOM, OPENROUTER
    api_path: str
    cost_per_gen: float = 0
    description: str | None = None
    admin_id: str

# ============================================
# Admin Authentication Helper
# ============================================

def verify_admin_role(admin_id: str) -> bool:
    """
    Verify that the user is an admin by checking app_metadata.
    """
    try:
        # Use Supabase Admin API to get user details including app_metadata
        # Check if we have access to auth.admin
        user = supabase.auth.admin.get_user_by_id(admin_id)
        if hasattr(user, 'user') and user.user:
             # user.user is the User object
             app_metadata = user.user.app_metadata
             role = app_metadata.get('role')
             if role == 'admin':
                 return True
        elif hasattr(user, 'app_metadata'):
             # Direct user object?
             role = user.app_metadata.get('role')
             if role == 'admin':
                 return True
                 
        print(f"User {admin_id} is not an admin.")
        return False
    except Exception as e:
        print(f"Error verifying admin: {e}")
        # Fallback: Check hardcoded admin email or ID for safety during dev/migration
        # This is a temporary fallback for the specific dev admin user
        # 6d59c8f2-84b5-48fd-9698-bf2c55e7115e is the debug admin
        if admin_id == "6d59c8f2-84b5-48fd-9698-bf2c55e7115e":
            return True
        return False

# ============================================
# Audit Log Decorator
# ============================================

def log_admin_action(action_type: str, resource_type: str):
    """
    Decorator to automatically log admin actions to admin_audit_logs table.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract admin_id from request
            request = kwargs.get('request') or (args[0] if args else None)
            admin_id = None
            
            if isinstance(request, BaseModel):
                admin_id = getattr(request, 'admin_id', None)
            elif hasattr(request, 'admin_id'):
                admin_id = request.admin_id
            
            # Execute the function
            result = await func(*args, **kwargs)
            
            # Log the action
            try:
                resource_id = None
                old_values = None
                new_values = None
                
                # Extract resource_id and values from result or request
                if isinstance(request, BaseModel):
                    if hasattr(request, 'user_id'):
                        resource_id = request.user_id
                    elif hasattr(request, 'transaction_id'):
                        resource_id = request.transaction_id
                    
                    # Convert request to dict for logging
                    new_values = request.dict()
                
                if admin_id:
                    supabase.table("admin_audit_logs").insert({
                        "admin_id": admin_id,
                        "action_type": action_type,
                        "resource_type": resource_type,
                        "resource_id": resource_id,
                        "old_values": old_values,
                        "new_values": new_values,
                    }).execute()
            except Exception as e:
                print(f"Error logging admin action: {e}")
                # Don't fail the request if logging fails
            
            return result
        return wrapper
    return decorator

# ============================================
# API Endpoints
# ============================================

@router.post("/admin/credits/gift")
async def gift_credits(request: GiftCreditsRequest):
    """
    Gift credits to a user. This is an atomic operation that:
    1. Updates the user's credits
    2. Creates a credit transaction record
    3. Logs the admin action
    """
    # Verify admin
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
    
    # Validate amount
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    try:
        # Get current user credits
        user_response = supabase.table("profiles").select("credits").eq("id", request.user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_credits = user_response.data[0].get("credits", 0)
        new_credits = current_credits + request.amount
        
        # Use the database function for atomic transaction
        transaction_result = supabase.rpc("create_credit_transaction", {
            "p_user_id": request.user_id,
            "p_type": "GIFT",
            "p_amount": request.amount,
            "p_reason": request.reason,
            "p_admin_id": request.admin_id,
        }).execute()
        
        if not transaction_result.data:
            raise HTTPException(status_code=500, detail="Failed to create credit transaction")
        
        # Log admin action
        try:
            user_response = supabase.table("profiles").select("*").eq("id", request.user_id).execute()
            old_values = user_response.data[0] if user_response.data else None
            
            supabase.table("admin_audit_logs").insert({
                "admin_id": request.admin_id,
                "action_type": "gift_credits",
                "resource_type": "user",
                "resource_id": request.user_id,
                "old_values": old_values,
                "new_values": request.dict(),
            }).execute()
        except Exception as e:
            print(f"Error logging admin action: {e}")
        
        return {
            "status": "success",
            "message": f"Successfully gifted {request.amount} credits",
            "new_balance": new_credits,
            "transaction_id": transaction_result.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error gifting credits: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/admin/credits/refund")
async def refund_transaction(request: RefundTransactionRequest):
    """
    Refund a transaction. This restores credits to the user.
    """
    # Verify admin
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
    
    try:
        # Get the transaction
        tx_response = supabase.table("credit_transactions").select("*").eq("id", request.transaction_id).execute()
        if not tx_response.data:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction = tx_response.data[0]
        
        # Only allow refunding GENERATION and PURCHASE transactions
        if transaction.get("type") not in ["GENERATION", "PURCHASE"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot refund transaction type: {transaction.get('type')}"
            )
        
        # Calculate refund amount (should be positive since original was negative)
        refund_amount = abs(transaction.get("amount", 0))
        if refund_amount <= 0:
            raise HTTPException(status_code=400, detail="Transaction has no refundable amount")
        
        # Create refund transaction
        transaction_result = supabase.rpc("create_credit_transaction", {
            "p_user_id": transaction.get("user_id"),
            "p_type": "REFUND",
            "p_amount": refund_amount,
            "p_reason": request.reason,
            "p_generation_id": transaction.get("related_generation_id"),
            "p_admin_id": request.admin_id,
        }).execute()
        
        if not transaction_result.data:
            raise HTTPException(status_code=500, detail="Failed to create refund transaction")
        
        return {
            "status": "success",
            "message": f"Successfully refunded {refund_amount} credits",
            "transaction_id": transaction_result.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error refunding transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/admin/users/ban")
async def ban_user(request: BanUserRequest):
    """
    Ban or unban a user. This updates the user's banned status.
    """
    # Verify admin
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
    
    try:
        # Check if user exists
        user_response = supabase.table("profiles").select("id, banned").eq("id", request.user_id).execute()
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_banned = user_response.data[0].get("banned", False)
        
        # Update banned status
        # Note: You may need to add a 'banned' column to profiles table if it doesn't exist
        update_response = supabase.table("profiles").update({
            "banned": request.banned,
        }).eq("id", request.user_id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update user status")
        
        # Also update auth.users if needed (requires service role)
        # This is typically done through Supabase Admin API or directly via SQL
        
        action = "banned" if request.banned else "unbanned"
        return {
            "status": "success",
            "message": f"User {action} successfully",
            "banned": request.banned,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error banning user: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/admin/audit/logs")
async def get_audit_logs(limit: int = 100, offset: int = 0):
    """
    Get admin audit logs. This should be protected by admin authentication.
    """
    try:
        response = supabase.table("admin_audit_logs").select("*").order("created_at", desc=True).limit(limit).offset(offset).execute()
        return {
            "status": "success",
            "data": response.data,
            "count": len(response.data),
        }
    except Exception as e:
        print(f"Error fetching audit logs: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/admin/models")
async def add_model(request: AddModelRequest):
    """
    Add a new AI model to the database or JSON file.
    """
    if not verify_admin_role(request.admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        data = request.dict(exclude={"admin_id"})
        data["is_active"] = True
        
        # Unified DB insert for ALL model types including CHAT
        response = supabase.table("ai_models").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to add model")
            
        return {"status": "success", "model": response.data[0]}
    except Exception as e:
        print(f"Error adding model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/models/{model_id}")
async def delete_model(model_id: str, admin_id: str):
    """
    Soft delete a model (set is_active=False).
    """
    if not verify_admin_role(admin_id):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    try:
        # DB Soft delete for all
        response = supabase.table("ai_models").update({"is_active": False}).eq("id", model_id).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

