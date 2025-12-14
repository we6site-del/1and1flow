-- AI Workflow 数据库架构
-- Supabase PostgreSQL Schema

-- ============================================
-- 1. 用户配置表 (扩展 auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 1000,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'basic', 'pro', 'ultimate')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户配置表索引
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier, subscription_status);

-- ============================================
-- 2. 项目表
-- ============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '未命名项目',
  description TEXT,
  thumbnail_url TEXT,
  canvas_data JSONB, -- 存储 tldraw 画布数据
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- 项目表索引
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX idx_projects_public ON public.projects(is_public) WHERE is_public = true;

-- ============================================
-- 3. 项目版本历史表
-- ============================================
CREATE TABLE public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  canvas_data JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- 项目版本索引
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id, version_number DESC);

-- ============================================
-- 4. AI 生成记录表
-- ============================================
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('text', 'image', 'video', 'audio')),
  model_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  input_data JSONB, -- 输入参数
  output_data JSONB, -- 生成结果
  credits_used INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- AI生成记录索引
CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id, created_at DESC);
CREATE INDEX idx_ai_generations_project_id ON public.ai_generations(project_id);
CREATE INDEX idx_ai_generations_status ON public.ai_generations(status);

-- ============================================
-- 5. 积分交易记录表
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 正数为增加，负数为消费
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'subscription', 'bonus', 'usage', 'refund')),
  description TEXT,
  related_generation_id UUID REFERENCES public.ai_generations(id) ON DELETE SET NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 积分交易索引
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id, created_at DESC);

-- ============================================
-- 6. 订阅历史表
-- ============================================
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10, 2),
  payment_method TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 订阅历史索引
CREATE INDEX idx_subscription_history_user_id ON public.subscription_history(user_id, started_at DESC);

-- ============================================
-- 7. 资产库表 (用户上传的图片、视频等)
-- ============================================
CREATE TABLE public.user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'document')),
  file_name TEXT NOT NULL,
  file_size INTEGER, -- bytes
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- 秒 (for video/audio)
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 资产库索引
CREATE INDEX idx_user_assets_user_id ON public.user_assets(user_id, created_at DESC);
CREATE INDEX idx_user_assets_project_id ON public.user_assets(project_id);
CREATE INDEX idx_user_assets_type ON public.user_assets(asset_type);

-- ============================================
-- 8. 用户活动日志表
-- ============================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 活动日志索引
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(activity_type);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 用户配置策略
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 项目策略
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- 项目版本策略
CREATE POLICY "Users can view own project versions"
  ON public.project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND (projects.user_id = auth.uid() OR projects.is_public = true)
    )
  );

CREATE POLICY "Users can insert own project versions"
  ON public.project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- AI生成记录策略
CREATE POLICY "Users can view own generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 积分交易策略
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 订阅历史策略
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- 资产库策略
CREATE POLICY "Users can view own assets"
  ON public.user_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.user_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.user_assets FOR DELETE
  USING (auth.uid() = user_id);

-- 活动日志策略
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 触发器函数
-- ============================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动创建用户配置
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 当新用户注册时自动创建配置
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 记录积分变化
CREATE OR REPLACE FUNCTION public.log_credit_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credits != OLD.credits THEN
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, balance_after, description)
    VALUES (
      NEW.id,
      NEW.credits - OLD.credits,
      CASE
        WHEN NEW.credits > OLD.credits THEN 'bonus'
        ELSE 'usage'
      END,
      NEW.credits,
      'Credits updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_credits_changed
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.credits IS DISTINCT FROM NEW.credits)
  EXECUTE FUNCTION public.log_credit_change();

-- ============================================
-- 视图和辅助函数
-- ============================================

-- 用户统计视图
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
  up.id,
  up.email,
  up.credits,
  up.subscription_tier,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT ag.id) as generation_count,
  SUM(CASE WHEN ag.status = 'completed' THEN ag.credits_used ELSE 0 END) as total_credits_used,
  MAX(p.updated_at) as last_project_update
FROM public.profiles up
LEFT JOIN public.projects p ON p.user_id = up.id
LEFT JOIN public.ai_generations ag ON ag.user_id = up.id
GROUP BY up.id, up.email, up.credits, up.subscription_tier;

-- 获取用户剩余积分
CREATE OR REPLACE FUNCTION public.get_user_credits(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT credits FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 扣除积分
CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT DEFAULT 'Credits deducted'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- 获取当前积分
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_uuid;

  -- 检查积分是否足够
  IF current_credits < amount THEN
    RETURN FALSE;
  END IF;

  -- 扣除积分
  UPDATE public.profiles
  SET credits = credits - amount
  WHERE id = user_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加积分
CREATE OR REPLACE FUNCTION public.add_credits(
  user_uuid UUID,
  amount INTEGER,
  transaction_type TEXT DEFAULT 'bonus',
  description TEXT DEFAULT 'Credits added'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid;

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, balance_after, description)
  SELECT id, amount, transaction_type, credits, description
  FROM public.profiles
  WHERE id = user_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 初始数据
-- ============================================

-- 插入示例订阅计划配置（可选）
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  credits_monthly INTEGER NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.subscription_plans (id, name, price_monthly, price_yearly, credits_monthly, features) VALUES
('free', '免费版', 0, 0, 100, '{"max_projects": 3, "max_generations": 10}'::jsonb),
('starter', '入门版', 99, 999, 2000, '{"max_projects": 50, "max_generations": 200}'::jsonb),
('basic', '基础版', 199, 1999, 3500, '{"max_projects": 200, "max_generations": 350}'::jsonb),
('pro', '专业版', 499, 4999, 11000, '{"max_projects": -1, "max_generations": 1100}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 权限设置
-- ============================================

-- 允许认证用户访问所有表
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 允许匿名用户读取订阅计划
GRANT SELECT ON public.subscription_plans TO anon;
