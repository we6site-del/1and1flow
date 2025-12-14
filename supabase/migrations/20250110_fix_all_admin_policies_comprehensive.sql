-- Migration: Comprehensive Fix for All Admin RLS Policies
-- This ensures admin users can view and manage all data

-- ============================================
-- 1. AI Models - Complete Policy Setup
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active models" ON public.ai_models;
DROP POLICY IF EXISTS "Service role can manage models" ON public.ai_models;
DROP POLICY IF EXISTS "Admin users can manage models" ON public.ai_models;
DROP POLICY IF EXISTS "Admin users can view all models" ON public.ai_models;

-- Regular users can view active models (but not admins - they use admin policy)
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

-- Admin users can view ALL models (including inactive)
CREATE POLICY "Admin users can view all models" ON public.ai_models
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin users can manage all models (INSERT, UPDATE, DELETE)
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

-- Service role can manage all models
CREATE POLICY "Service role can manage models" ON public.ai_models
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 2. Profiles - Complete Policy Setup
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin users can view ALL profiles
CREATE POLICY "Admin users can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin users can manage all profiles
CREATE POLICY "Admin users can manage all profiles" ON public.profiles
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Service role can manage all profiles
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 3. Generations - Admin Access
-- ============================================

DROP POLICY IF EXISTS "Admin users can view all generations" ON public.generations;
CREATE POLICY "Admin users can view all generations" ON public.generations
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 4. Credit Transactions - Admin Access
-- ============================================

DROP POLICY IF EXISTS "Admin users can view all credit transactions" ON public.credit_transactions;
CREATE POLICY "Admin users can view all credit transactions" ON public.credit_transactions
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- 5. Projects - Admin Access
-- ============================================

DROP POLICY IF EXISTS "Admin users can view all projects" ON public.projects;
CREATE POLICY "Admin users can view all projects" ON public.projects
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );








