from fastapi import Depends, HTTPException, Header
from typing import Optional
from services.supabase_client import supabase

async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Validates the Bearer token from the Authorization header using Supabase Auth.
    Returns the user object if valid, raises HTTPException otherwise.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    
    token = authorization.split(" ")[1]
    
    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        return user_response.user
        
    except Exception as e:
        print(f"Auth error: {e}")
        # If call fails, it might be an expired token or connection issue
        raise HTTPException(status_code=401, detail="Authentication failed")
