-- Migration: Diagnose Admin Panel Issues
-- This script helps diagnose why admin can't see data

-- ============================================
-- 1. Check RLS Policies for ai_models
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'ai_models'
ORDER BY policyname;

-- ============================================
-- 2. Check RLS Policies for profiles
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- 3. Check if data exists (bypassing RLS with service role)
-- ============================================
-- Note: These queries bypass RLS, so they show actual data
SELECT 
  'ai_models' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_count
FROM public.ai_models;

SELECT 
  'profiles' as table_name,
  COUNT(*) as total_count
FROM public.profiles;

-- ============================================
-- 4. Check admin users
-- ============================================
SELECT 
  u.id,
  u.email,
  u.raw_app_meta_data->>'role' as role,
  CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'No Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.raw_app_meta_data->>'role' = 'admin'
ORDER BY u.created_at DESC;

-- ============================================
-- 5. Test RLS: Simulate admin user query
-- ============================================
-- This simulates what happens when an admin user queries
-- Note: This might not work in SQL Editor, but shows the logic

-- Check if admin policy would work
SELECT 
  'Admin policy check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'ai_models' 
      AND policyname = 'Admin users can view all models'
    ) THEN 'Policy EXISTS'
    ELSE 'Policy MISSING'
  END as status;

-- ============================================
-- 6. Show recent ai_models (if any)
-- ============================================
SELECT 
  id,
  name,
  type,
  provider,
  is_active,
  created_at
FROM public.ai_models
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 7. Show recent profiles (if any)
-- ============================================
SELECT 
  id,
  email,
  credits,
  is_pro,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;








