-- Migration: Create profiles for existing auth.users that don't have profiles
-- This ensures all authenticated users have a profile record

-- Drop function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.create_missing_profiles();

-- Function to create profile for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(created_count INTEGER, skipped_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Insert profiles for users that don't have one
  -- Use a simpler approach that matches the schema.sql structure
  WITH users_without_profiles AS (
    SELECT 
      u.id,
      u.email,
      COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as avatar_url,
      u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  )
  INSERT INTO public.profiles (id, email, avatar_url, credits, is_pro, created_at)
  SELECT 
    id,
    email,
    avatar_url,
    100 as credits, -- Default credits
    false as is_pro,
    created_at
  FROM users_without_profiles
  ON CONFLICT (id) DO NOTHING;
  
  -- Count how many were created
  GET DIAGNOSTICS created_count = ROW_COUNT;
  
  -- Return results
  RETURN QUERY SELECT created_count, skipped_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_missing_profiles TO service_role;

-- Run the function to create missing profiles
-- This will show how many profiles were created
SELECT * FROM public.create_missing_profiles();

-- Note: We keep the function for future use, you can drop it if needed:
-- DROP FUNCTION IF EXISTS public.create_missing_profiles();

