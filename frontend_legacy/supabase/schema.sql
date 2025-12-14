-- =====================================================
-- AI Workflow Database Schema
-- =====================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 用户资料表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    credits INTEGER DEFAULT 200, -- 初始积分
    subscription_tier TEXT DEFAULT 'free', -- free, pro, enterprise
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 策略：用户可以查看所有资料，但只能编辑自己的
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- 作品表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Work',
    description TEXT,
    thumbnail_url TEXT,

    -- 工作流数据 (tldraw的完整状态)
    workflow_data JSONB NOT NULL,

    -- 生成的内容
    generated_content JSONB, -- {images: [], videos: [], texts: []}

    -- 统计信息
    node_count INTEGER DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    total_generations INTEGER DEFAULT 0,

    -- 状态
    is_public BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,

    -- 标签和分类
    tags TEXT[],
    category TEXT, -- portrait, landscape, product, etc.

    -- 元数据
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS works_user_id_idx ON public.works(user_id);
CREATE INDEX IF NOT EXISTS works_is_public_idx ON public.works(is_public);
CREATE INDEX IF NOT EXISTS works_is_template_idx ON public.works(is_template);
CREATE INDEX IF NOT EXISTS works_created_at_idx ON public.works(created_at DESC);
CREATE INDEX IF NOT EXISTS works_tags_idx ON public.works USING GIN(tags);

-- 启用 RLS
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- 策略：公开作品所有人可见
CREATE POLICY "Public works are viewable by everyone"
    ON public.works FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

-- 策略：用户可以创建自己的作品
CREATE POLICY "Users can create own works"
    ON public.works FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 策略：用户可以更新自己的作品
CREATE POLICY "Users can update own works"
    ON public.works FOR UPDATE
    USING (auth.uid() = user_id);

-- 策略：用户可以删除自己的作品
CREATE POLICY "Users can delete own works"
    ON public.works FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 工作流模板表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES public.works(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,

    -- 模板数据
    template_data JSONB NOT NULL,

    -- 分类
    category TEXT NOT NULL, -- starter, advanced, professional
    use_case TEXT, -- portrait, branding, social-media, etc.
    difficulty_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced

    -- 统计
    use_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- 标签
    tags TEXT[],

    -- 状态
    is_public BOOLEAN DEFAULT true,
    is_official BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS templates_category_idx ON public.templates(category);
CREATE INDEX IF NOT EXISTS templates_is_public_idx ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS templates_tags_idx ON public.templates USING GIN(tags);

-- 启用 RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Public templates are viewable by everyone"
    ON public.templates FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
    ON public.templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
    ON public.templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
    ON public.templates FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 生成记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    work_id UUID REFERENCES public.works(id) ON DELETE SET NULL,

    -- 生成类型
    type TEXT NOT NULL, -- image, video, text
    model TEXT NOT NULL,

    -- 输入输出
    prompt TEXT,
    input_images TEXT[],
    output_url TEXT,

    -- 参数
    parameters JSONB,

    -- 成本和状态
    credits_used INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_work_id_idx ON public.generations(work_id);
CREATE INDEX IF NOT EXISTS generations_type_idx ON public.generations(type);
CREATE INDEX IF NOT EXISTS generations_created_at_idx ON public.generations(created_at DESC);

-- 启用 RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Users can view own generations"
    ON public.generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations"
    ON public.generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 点赞表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    work_id UUID REFERENCES public.works(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 确保用户对同一作品/模板只能点赞一次
    CONSTRAINT unique_work_like UNIQUE(user_id, work_id),
    CONSTRAINT unique_template_like UNIQUE(user_id, template_id),
    CONSTRAINT like_target CHECK (
        (work_id IS NOT NULL AND template_id IS NULL) OR
        (work_id IS NULL AND template_id IS NOT NULL)
    )
);

-- 索引
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS likes_work_id_idx ON public.likes(work_id);
CREATE INDEX IF NOT EXISTS likes_template_id_idx ON public.likes(template_id);

-- 启用 RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Users can create own likes"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 分享表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES public.works(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

    share_token TEXT UNIQUE NOT NULL,
    share_url TEXT NOT NULL,

    -- 分享设置
    allow_download BOOLEAN DEFAULT false,
    allow_fork BOOLEAN DEFAULT true,
    password_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- 统计
    view_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS shares_work_id_idx ON public.shares(work_id);
CREATE INDEX IF NOT EXISTS shares_share_token_idx ON public.shares(share_token);
CREATE INDEX IF NOT EXISTS shares_user_id_idx ON public.shares(user_id);

-- 启用 RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Shares are viewable by token"
    ON public.shares FOR SELECT
    USING (true);

CREATE POLICY "Users can create shares for own works"
    ON public.shares FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.works WHERE id = work_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can delete own shares"
    ON public.shares FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 积分交易记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

    amount INTEGER NOT NULL, -- 正数表示增加，负数表示扣除
    balance_after INTEGER NOT NULL,

    transaction_type TEXT NOT NULL, -- purchase, generation, bonus, refund
    description TEXT,

    -- 关联记录
    generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON public.credit_transactions(created_at DESC);

-- 启用 RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Users can view own transactions"
    ON public.credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- 触发器：自动创建用户资料
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, credits)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        200
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 触发器：更新 updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到各个表
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_works_updated_at ON public.works;
CREATE TRIGGER update_works_updated_at
    BEFORE UPDATE ON public.works
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 视图：用户统计
-- =====================================================
CREATE OR REPLACE VIEW public.user_stats AS
SELECT
    p.id AS user_id,
    p.username,
    p.email,
    p.credits,
    COUNT(DISTINCT w.id) AS total_works,
    COUNT(DISTINCT t.id) AS total_templates,
    COUNT(DISTINCT g.id) AS total_generations,
    SUM(CASE WHEN w.is_public THEN 1 ELSE 0 END) AS public_works,
    SUM(w.view_count) AS total_views,
    SUM(w.like_count) AS total_likes
FROM public.profiles p
LEFT JOIN public.works w ON p.id = w.user_id
LEFT JOIN public.templates t ON p.id = t.user_id
LEFT JOIN public.generations g ON p.id = g.user_id
GROUP BY p.id, p.username, p.email, p.credits;

-- =====================================================
-- 视图：热门作品
-- =====================================================
CREATE OR REPLACE VIEW public.trending_works AS
SELECT
    w.*,
    p.username,
    p.avatar_url AS user_avatar,
    (w.view_count * 0.1 + w.like_count * 0.5 + w.fork_count * 0.4) AS trending_score
FROM public.works w
JOIN public.profiles p ON w.user_id = p.id
WHERE w.is_public = true
ORDER BY trending_score DESC, w.created_at DESC;

-- =====================================================
-- 视图：热门模板
-- =====================================================
CREATE OR REPLACE VIEW public.trending_templates AS
SELECT
    t.*,
    p.username,
    p.avatar_url AS user_avatar,
    (t.view_count * 0.1 + t.like_count * 0.3 + t.use_count * 0.6) AS trending_score
FROM public.templates t
JOIN public.profiles p ON t.user_id = p.id
WHERE t.is_public = true
ORDER BY trending_score DESC, t.created_at DESC;

-- =====================================================
-- 完成
-- =====================================================
-- Schema creation completed successfully
