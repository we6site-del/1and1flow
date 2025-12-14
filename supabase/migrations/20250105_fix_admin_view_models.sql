-- Migration: Fix RLS policies to ensure admin can view all models
-- This fixes the issue where admins can't see newly created models

-- The issue is that Supabase RLS policies are evaluated with OR logic
-- So we need to ensure admin policy takes precedence or doesn't conflict

-- Drop the conflicting "Anyone can view active models" policy
DROP POLICY IF EXISTS "Anyone can view active models" ON public.ai_models;

-- Recreate it to only apply to non-admin users
-- Regular users can view active models
CREATE POLICY "Anyone can view active models" ON public.ai_models
  FOR SELECT 
  USING (
    is_active = true 
    AND (
      auth.role() IS NULL 
      OR auth.role() = 'anon'
      OR (
        auth.role() = 'authenticated' 
        AND (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin'
      )
    )
  );

-- Ensure admin policy allows viewing ALL models (including inactive)
-- This should already exist from previous migration, but ensure it's correct
DROP POLICY IF EXISTS "Admin users can view all models" ON public.ai_models;
CREATE POLICY "Admin users can view all models" ON public.ai_models
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

