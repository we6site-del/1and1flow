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
