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
