-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  avatar_url text,
  credits integer default 100,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  name text default 'Untitled Project',
  canvas_data jsonb default '{}'::jsonb,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create generations table
create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id), -- Optional for now
  node_id text, -- ID of the node in tldraw
  prompt text,
  status text default 'PENDING', -- PENDING, COMPLETED, FAILED
  result_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.generations enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can view own generations" on public.generations
  for select using (auth.uid() = user_id);

-- Function to deduct credits safely
create or replace function deduct_user_credits(user_uuid uuid, amount_to_deduct int)
returns void as $$
declare
  current_credits int;
begin
  select credits into current_credits from public.profiles where id = user_uuid;
  
  if current_credits < amount_to_deduct then
    raise exception 'Insufficient credits';
  end if;
  
  update public.profiles
  set credits = credits - amount_to_deduct
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- Function to add credits (for payments)
create or replace function add_user_credits(user_uuid uuid, amount_to_add int)
returns void as $$
begin
  update public.profiles
  set credits = credits + amount_to_add
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Migration: Add ai_models table for server-driven UI
-- This table stores model configurations and parameter schemas
-- that drive the dynamic rendering of generator nodes

-- Create ai_models table
create table if not exists public.ai_models (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('IMAGE', 'VIDEO')),
  provider text not null check (provider in ('REPLICATE', 'FAL', 'CUSTOM')),
  api_path text not null, -- e.g., "kling-ai/kling-video-v2" for Replicate
  cost_per_gen integer not null default 0,
  is_active boolean default true,
  parameters_schema jsonb default '[]'::jsonb, -- JSON Schema for UI rendering
  description text,
  icon_url text, -- Optional icon for UI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index if not exists ai_models_type_idx on public.ai_models(type);
create index if not exists ai_models_is_active_idx on public.ai_models(is_active);
create index if not exists ai_models_provider_idx on public.ai_models(provider);

-- Enable RLS
alter table public.ai_models enable row level security;

-- RLS Policies: Everyone can read active models, only service role can write
create policy "Anyone can view active models" on public.ai_models
  for select using (is_active = true);

create policy "Service role can manage models" on public.ai_models
  for all using (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger to update updated_at
create or replace function update_ai_models_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_ai_models_updated_at
  before update on public.ai_models
  for each row
  execute function update_ai_models_updated_at();

-- Insert some default models (examples)
insert into public.ai_models (name, type, provider, api_path, cost_per_gen, parameters_schema, description) values
  (
    'Nano Banana Pro',
    'IMAGE',
    'FAL',
    'fal-ai/flux-pro',
    22,
    '[
      {
        "key": "aspect_ratio",
        "label": "Aspect Ratio",
        "type": "grid_select",
        "options": [
          {"label": "21:9", "value": "21:9", "desc": "1568×672"},
          {"label": "16:9", "value": "16:9", "desc": "1456×816"},
          {"label": "4:3", "value": "4:3", "desc": "1232×928"},
          {"label": "3:2", "value": "3:2", "desc": "1344×896"},
          {"label": "1:1", "value": "1:1", "desc": "1024×1024"},
          {"label": "9:16", "value": "9:16", "desc": "816×1456"},
          {"label": "3:4", "value": "3:4", "desc": "928×1232"},
          {"label": "2:3", "value": "2:3", "desc": "896×1344"},
          {"label": "5:4", "value": "5:4", "desc": "1280×1024"},
          {"label": "4:5", "value": "4:5", "desc": "1024×1280"}
        ],
        "default": "3:4"
      }
    ]'::jsonb,
    'High-quality image generation model'
  ),
  (
    'Kling 2.1 Master',
    'VIDEO',
    'REPLICATE',
    'kling-ai/kling-video-v2',
    160,
    '[
      {
        "key": "duration",
        "label": "Duration",
        "type": "select",
        "options": [
          {"label": "4s", "value": "4s"},
          {"label": "5s", "value": "5s"},
          {"label": "6s", "value": "6s"},
          {"label": "8s", "value": "8s"}
        ],
        "default": "5s"
      },
      {
        "key": "aspect_ratio",
        "label": "Aspect Ratio",
        "type": "select",
        "options": [
          {"label": "16:9", "value": "16:9", "desc": "1080p"},
          {"label": "9:16", "value": "9:16", "desc": "1080p"}
        ],
        "default": "16:9"
      }
    ]'::jsonb,
    'Professional video generation model'
  ),
  (
    'Veo 3.1 Fast',
    'VIDEO',
    'REPLICATE',
    'google/veo-3.1-fast',
    192,
    '[
      {
        "key": "duration",
        "label": "Duration",
        "type": "select",
        "options": [
          {"label": "4s", "value": "4s"},
          {"label": "6s", "value": "6s"},
          {"label": "8s", "value": "8s"}
        ],
        "default": "8s"
      },
      {
        "key": "aspect_ratio",
        "label": "Aspect Ratio",
        "type": "select",
        "options": [
          {"label": "16:9", "value": "16:9", "desc": "1080p"},
          {"label": "9:16", "value": "9:16", "desc": "1080p"}
        ],
        "default": "16:9"
      }
    ]'::jsonb,
    'Fast video generation model'
  )
on conflict do nothing;


-- Migration: Add admin-related tables for audit logging and credit transactions
-- This migration adds support for admin operations tracking and credit ledger

-- ============================================
-- 1. Admin Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'gift_credits', 'ban_user', 'update_model', 'delete_generation', etc.
  resource_type TEXT NOT NULL, -- 'user', 'model', 'generation', 'profile', etc.
  resource_id UUID, -- ID of the affected resource
  old_values JSONB, -- Previous state (for updates)
  new_values JSONB, -- New state (for updates/creates)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for admin_audit_logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON public.admin_audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can read/write audit logs
CREATE POLICY "Service role only" ON public.admin_audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 2. Credit Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('TOPUP', 'GENERATION', 'REFUND', 'GIFT', 'REFERRAL', 'PURCHASE')),
  amount INTEGER NOT NULL, -- Positive for credits added, negative for spent
  balance_after INTEGER NOT NULL, -- User's credit balance after this transaction
  reason TEXT, -- Optional reason/description
  related_generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If action was by admin
  stripe_payment_intent_id TEXT, -- For tracking Stripe payments
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for credit_transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_generation_id ON public.credit_transactions(related_generation_id);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert (for admin actions and system operations)
CREATE POLICY "Service role can insert transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 3. Content Reports Table (for moderation)
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for content_reports
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_generation_id ON public.content_reports(generation_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON public.content_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can report content
CREATE POLICY "Users can report content" ON public.content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- RLS Policy: Service role can manage reports
CREATE POLICY "Service role can manage reports" ON public.content_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 4. Update generations table (add moderation fields)
-- ============================================
DO $$ 
BEGIN
  -- Add is_nsfw column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'is_nsfw'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN is_nsfw BOOLEAN DEFAULT false;
  END IF;

  -- Add is_deleted column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;

  -- Add nsfw_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'nsfw_score'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN nsfw_score FLOAT;
  END IF;
END $$;

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_generations_moderation ON public.generations(is_nsfw, is_deleted) 
  WHERE is_nsfw = true OR is_deleted = true;

-- ============================================
-- 5. Helper function: Log admin action
-- ============================================
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.log_admin_action TO service_role;

-- ============================================
-- 6. Helper function: Create credit transaction
-- ============================================
CREATE OR REPLACE FUNCTION public.create_credit_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_generation_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_after INTEGER;
BEGIN
  -- Get current balance
  SELECT credits INTO v_balance_after FROM public.profiles WHERE id = p_user_id;
  
  -- Calculate new balance
  v_balance_after := v_balance_after + p_amount;
  
  -- Update user's credits
  UPDATE public.profiles 
  SET credits = v_balance_after 
  WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    reason,
    related_generation_id,
    admin_id,
    stripe_payment_intent_id
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    v_balance_after,
    p_reason,
    p_generation_id,
    p_admin_id,
    p_stripe_payment_intent_id
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.create_credit_transaction TO service_role;

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








-- Add banned field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS profiles_banned_idx ON public.profiles(banned) WHERE banned = true;

-- Add INSERT policy for profiles table
-- This allows users to create their own profile if it doesn't exist

-- Check if policy already exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Add username and bio fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add unique constraint on username (optional, can be removed if you want to allow duplicates)
-- CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username) WHERE username IS NOT NULL;

-- Migration: Add is_default column to ai_models table
-- This column indicates if a model is the default model for its type

-- Add is_default column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_models' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.ai_models ADD COLUMN is_default BOOLEAN DEFAULT false;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS ai_models_is_default_idx ON public.ai_models(is_default) WHERE is_default = true;
  END IF;
END $$;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID
);

-- Turn on RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (so frontend/backend can read public settings)
-- Or restrict to authenticated users if needed. For payments, backend needs read.
CREATE POLICY "Allow read access for all" ON system_settings
    FOR SELECT USING (true);

-- Allow write access only to admins (you might need to adjust based on your admin role logic)
-- Assuming you have a custom claim or just checking ID for now in backend.
-- For simple backend-side enforcement, we can enable full access for service_role and restrict public.

-- Seed default payment settings
VALUES 
    ('payment_methods', '["card"]', 'Enabled payment methods for Stripe Checkout')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- Prompt Gallery (Curated Prompts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curated_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    image_url TEXT NOT NULL,
    model_config JSONB,
    category TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    author_id UUID
);

ALTER TABLE curated_prompts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON curated_prompts FOR SELECT USING (true);
-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) NOT NULL,
    price_yearly NUMERIC(10, 2) NOT NULL,
    credits_monthly INTEGER NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    tier_level INTEGER DEFAULT 0, -- 0: Free, 1: Basic, 2: Pro, 3: Ultimate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching active plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Insert default plans based on the user provided image
INSERT INTO subscription_plans (name, price_monthly, price_yearly, credits_monthly, features, is_popular, tier_level)
VALUES 
('Starter', 19.00, 16.00, 2000, '["每日获得100刷新积分", "访问所有图片和编辑模型", "访问所有视频模型", "可商用", "编辑元素"]', false, 1),
('Basic', 32.00, 27.00, 3500, '["每日获得100刷新积分", "访问所有图片和编辑模型", "访问所有视频模型", "可商用", "编辑元素", "Nano Banana", "Seedream 4.0", "Midjourney", "Seedream 4.5"]', false, 2),
('Pro', 90.00, 45.00, 11000, '["每日获得100刷新积分", "访问所有图片和编辑模型", "访问所有视频模型", "充值积分享九折优惠", "可商用", "编辑元素", "Nano Banana", "Seedream 4.0", "Midjourney", "Seedream 4.5", "Nano Banana Pro"]', true, 3),
('Ultimate', 199.00, 99.00, 27000, '["每日获得100刷新积分", "访问所有图片和编辑模型", "访问所有视频模型", "充值积分享九折优惠", "可商用", "编辑元素", "Nano Banana", "Seedream 4.0", "Midjourney", "Kling O1", "Seedream 4.5", "Nano Banana Pro"]', false, 4)
ON CONFLICT DO NOTHING;

INSERT INTO curated_prompts (title, prompt, negative_prompt, image_url, category, tags, is_active)
VALUES 
(
    'Cyberpunk City', 
    'A futuristic city with neon lights, raining, cyberpunk style, high detail, 8k', 
    'blurry, low quality', 
    'https://images.unsplash.com/photo-1531297461136-82lw9z0u8j0?auto=format&fit=crop&w=1000&q=80', 
    'Sci-Fi', 
    ARRAY['cyberpunk', 'city', 'neon'],
    true
),
(
    'Abstract Fluid', 
    'Colorful fluid simulation, abstract art, vibrant colors, flowing shapes, 4k wallpaper', 
    'text, watermarks', 
    'https://images.unsplash.com/photo-1541701494587-b585cc449868?auto=format&fit=crop&w=1000&q=80', 
    'Abstract', 
    ARRAY['abstract', 'fluid', 'colorful'],
    true
);
-- Add slug column to generations table
ALTER TABLE generations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_generations_slug ON generations(slug);
-- Index for querying generations by user (e.g. for history)
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

-- Index for querying generations by project (e.g. for project thumbnails)
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON generations(project_id);

-- Index for querying generations by status (e.g. finding completed ones)
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

-- Composite index for the specific query used in projects.py fallback
-- .eq("project_id", item["id"]).eq("status", "COMPLETED").order("created_at", desc=True)
CREATE INDEX IF NOT EXISTS idx_generations_project_status_created ON generations(project_id, status, created_at DESC);
-- Function to safely add credits to a user
CREATE OR REPLACE FUNCTION add_user_credits(user_uuid UUID, amount_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = COALESCE(credits, 0) + amount_to_add
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop the existing constraint
ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_provider_check;

-- Re-add the constraint with OPENROUTER included
ALTER TABLE ai_models ADD CONSTRAINT ai_models_provider_check 
    CHECK (provider IN ('REPLICATE', 'FAL', 'CUSTOM', 'OPENROUTER'));
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- 1. Allow users to view their own projects
CREATE POLICY "Users can view own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Allow users to insert their own projects
CREATE POLICY "Users can create own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own projects
CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Allow users to delete their own projects
CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);

-- Verify it worked
SELECT count(*) FROM projects;
