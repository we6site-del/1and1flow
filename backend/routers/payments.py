from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
import stripe
import os
from services.supabase_client import supabase
from data.default_plans import DEFAULT_PLANS

router = APIRouter()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

class CheckoutRequest(BaseModel):
    user_id: str
    plan_id: str
    redirect_url: str
    is_yearly: bool = False

@router.post("/stripe/checkout")
async def create_checkout_session(request: CheckoutRequest):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")

    try:
        # 1. Fetch plan details
        plan = None
        try:
            plan_res = supabase.table("subscription_plans").select("*").eq("id", request.plan_id).execute()
            if plan_res.data:
                plan = plan_res.data[0]
        except Exception:
            pass
        
        # Fallback to default plans if not found in DB
        if not plan:
            plan = next((p for p in DEFAULT_PLANS if p["id"] == request.plan_id), None)

        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        # Calculate price and credits
        price = plan["price_yearly"] if request.is_yearly else plan["price_monthly"]
        credits = plan["credits_monthly"]
        
        # Determine allowed payment methods from System Settings
        payment_method_types = ["card"] # Default
        try:
            settings_res = supabase.table("system_settings").select("value").eq("key", "payment_methods").execute()
            if settings_res.data:
                payment_method_types = settings_res.data[0]["value"]
                # Ensure it's a list
                if not isinstance(payment_method_types, list):
                     payment_method_types = ["card"]
        except Exception as e:
            print(f"Warning: Could not fetch payment settings, defaulting to card. Error: {e}")

        # Create Stripe Session
        session = stripe.checkout.sessions.create(
            payment_method_types=payment_method_types,
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"{plan['name']} Plan ({'Yearly' if request.is_yearly else 'Monthly'})",
                            "description": f"Includes {credits} credits per month",
                        },
                        "unit_amount": int(price * 100),  # Convert to cents
                    },
                    "quantity": 1,
                },
            ],
            mode="payment", # Or "subscription" if you want recurring billing
            success_url=f"{request.redirect_url}?success=true",
            cancel_url=f"{request.redirect_url}?canceled=true",
            metadata={
                "user_id": request.user_id,
                "plan_id": request.plan_id,
                "credits": str(credits),
                "is_yearly": str(request.is_yearly)
            },
        )
        return {"sessionId": session.id, "url": session.url}
    except Exception as e:
        print(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    if not endpoint_secret:
        raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")

    payload = await request.body()

    try:
        event = stripe.webhook.construct_event(
            payload, stripe_signature, endpoint_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        credits = int(session.get("metadata", {}).get("credits", 0))

        if user_id and credits > 0:
            try:
                # Update user credits
                # First get current credits
                profile_res = supabase.table("profiles").select("credits").eq("id", user_id).single().execute()
                current_credits = profile_res.data.get("credits", 0) or 0
                
                new_credits = current_credits + credits
                
                supabase.table("profiles").update({"credits": new_credits}).eq("id", user_id).execute()
                print(f"Credits added for user {user_id}: +{credits}")
            except Exception as e:
                print(f"Error adding credits via webhook: {e}")
                return {"status": "error", "message": str(e)}

    return {"status": "success"}

# Mock endpoint kept for reference or fallback if needed, but main flow uses Stripe now
class MockCheckoutRequest(BaseModel):
    user_id: str
    plan_id: str

@router.post("/mock/checkout")
def mock_checkout(request: MockCheckoutRequest):
    # ... (Existing mock implementation if you want to keep it, otherwise remove)
    return {"status": "deprecated", "message": "Use /stripe/checkout"}
