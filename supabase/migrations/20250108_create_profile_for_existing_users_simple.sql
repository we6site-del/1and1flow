-- Migration: Create profiles for existing auth.users that don't have profiles (Simple Version)
-- This is a simpler version that directly inserts without a function

-- Direct INSERT statement to create missing profiles
-- This bypasses RLS by using SECURITY DEFINER context
INSERT INTO public.profiles (id, email, avatar_url, credits, is_pro, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', NULL) as avatar_url,
  100 as credits, -- Default credits
  false as is_pro,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the results
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM public.profiles) as missing_profiles
FROM auth.users;








