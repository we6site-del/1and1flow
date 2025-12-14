-- Create curated_prompts table
CREATE TABLE IF NOT EXISTS public.curated_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXt NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    image_url TEXT NOT NULL,
    model_config JSONB DEFAULT '{}'::jsonb,
    category TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curated_prompts ENABLE ROW LEVEL SECURITY;

-- Create Policy: Public Read Access
CREATE POLICY "Public Prompts are viewable by everyone"
ON public.curated_prompts FOR SELECT
USING (true);

-- Create Policy: Service Role (Admin) Full Access
-- Note: Service role bypasses RLS, but explicit policy for authenticated admins (if needed)
-- can be added. For now, we rely on service role or admin ID check in backend code.
-- But usually Supabase dashboard users are admins.
-- Let's add an insert policy for authenticated users with specific role if table is not robustly protected.
-- But user asked for "Admin Only" POST in backend. Backend typically uses SERVICE_KEY or checks UID.
-- We will keep RLS simple for now: Public Read.

-- Index for category for faster filtering
CREATE INDEX IF NOT EXISTS idx_curated_prompts_category ON public.curated_prompts(category);
