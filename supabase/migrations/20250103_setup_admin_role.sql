-- Migration: Setup Admin Role Helper
-- This migration provides SQL functions to easily set admin roles for users

-- ============================================
-- Helper Function: Set User as Admin
-- ============================================
CREATE OR REPLACE FUNCTION public.set_user_as_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update app_metadata to set role as admin
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE id = user_record.id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users (or service role)
GRANT EXECUTE ON FUNCTION public.set_user_as_admin TO service_role;

-- ============================================
-- Helper Function: Remove Admin Role
-- ============================================
CREATE OR REPLACE FUNCTION public.remove_admin_role(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Remove role from app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data - 'role'
  WHERE id = user_record.id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.remove_admin_role TO service_role;

-- ============================================
-- Helper Function: List All Admins
-- ============================================
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at
  FROM auth.users u
  WHERE u.raw_app_meta_data->>'role' = 'admin'
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.list_admins TO service_role;

-- ============================================
-- Usage Examples (commented out - uncomment and modify as needed)
-- ============================================

-- Example 1: Set a specific user as admin by email
-- SELECT public.set_user_as_admin('your-email@example.com');

-- Example 2: Set the first user as admin (for development)
-- SELECT public.set_user_as_admin(
--   (SELECT email FROM auth.users ORDER BY created_at LIMIT 1)
-- );

-- Example 3: List all admins
-- SELECT * FROM public.list_admins();

-- Example 4: Remove admin role from a user
-- SELECT public.remove_admin_role('user-email@example.com');








