-- Migration: Ensure admin users can view all data in admin panel
-- This is a comprehensive fix for all tables that admin needs to access

-- ============================================
-- 1. AI Models - Already fixed in 20250105, but ensure it's correct
-- ============================================
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Admin users can view all models" ON public.ai_models;
CREATE POLICY "Admin users can view all models" ON public.ai_models
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 2. Generations - Allow admin to view all
-- ============================================
DROP POLICY IF EXISTS "Admin users can view all generations" ON public.generations;
CREATE POLICY "Admin users can view all generations" ON public.generations
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 3. Credit Transactions - Allow admin to view all
-- ============================================
DROP POLICY IF EXISTS "Admin users can view all credit transactions" ON public.credit_transactions;
CREATE POLICY "Admin users can view all credit transactions" ON public.credit_transactions
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 4. Projects - Allow admin to view all
-- ============================================
DROP POLICY IF EXISTS "Admin users can view all projects" ON public.projects;
CREATE POLICY "Admin users can view all projects" ON public.projects
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );








