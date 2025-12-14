-- Migration: Fix RLS policies for profiles table to allow admin users to view all profiles
-- This fixes the issue where admins can't see user profiles in the admin panel

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admin users to view ALL profiles (for admin panel)
CREATE POLICY "Admin users can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Allow admin users to update any profile (for admin operations like gifting credits)
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

-- Allow service role to manage all profiles (for backend operations)
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');








