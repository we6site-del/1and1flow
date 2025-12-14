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

