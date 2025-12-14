-- Migration: Add RLS policy for admin users to manage ai_models
-- This allows users with admin role to create, update, and delete AI models

-- Drop existing service role policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Service role can manage models" ON public.ai_models;

-- Allow service role to manage all models
CREATE POLICY "Service role can manage models" ON public.ai_models
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow admin users to manage all models (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin users can manage models" ON public.ai_models
  FOR ALL 
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Allow authenticated admin users to view all models (including inactive ones)
CREATE POLICY "Admin users can view all models" ON public.ai_models
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
