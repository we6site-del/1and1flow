import os
import sys
# Add current directory to path so we can import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import supabase

def list_users():
    try:
        # Note: pagination might be needed for many users, but fine for dev
        response = supabase.auth.admin.list_users()
        # response might be a paginated response object or list depending on version
        # For supabase-py > 2, it often returns a UserList object or similar
        print("--- Users ---")
        users = response if isinstance(response, list) else response.users if hasattr(response, 'users') else []
        
        for user in users:
             role = user.app_metadata.get('role', 'user') if user.app_metadata else 'user'
             print(f"Email: {user.email}")
             print(f"ID: {user.id}")
             print(f"Role: {role}")
             print("---")
        return users
    except Exception as e:
        print(f"Error listing users: {e}")
        import traceback
        traceback.print_exc()
        return []

def set_admin(email: str):
    try:
        users = list_users()
        target_user = next((u for u in users if u.email == email), None)
        
        if not target_user:
            print(f"User {email} not found.")
            return

        print(f"Promoting {target_user.email} (ID: {target_user.id}) to admin...")
        supabase.auth.admin.update_user_by_id(
            target_user.id, 
            {"app_metadata": {"role": "admin"}}
        )
        print("Success! Role set to 'admin'.")
        
        # Verify
        updated = supabase.auth.admin.get_user_by_id(target_user.id)
        print(f"Verification: {updated.user.app_metadata}")

    except Exception as e:
        print(f"Error setting admin: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "list":
             list_users()
        else:
             set_admin(sys.argv[1])
    else:
        print("Usage: python set_admin_role.py [list | <email>]")
