-- Create Business Posts Table
CREATE TABLE IF NOT EXISTS public.business_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS
ALTER TABLE public.business_posts ENABLE ROW LEVEL SECURITY;
-- 1. Everyone can read published posts
DROP POLICY IF EXISTS "Posts are public" ON public.business_posts;
CREATE POLICY "Posts are public" ON public.business_posts FOR
SELECT USING (is_published = true);
-- 2. Owners can manage their own posts
DROP POLICY IF EXISTS "Owners can manage own posts" ON public.business_posts;
CREATE POLICY "Owners can manage own posts" ON public.business_posts FOR ALL USING (
    auth.uid() = (
        SELECT user_id
        FROM service_providers
        WHERE id = provider_id
    )
);
-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_posts_provider_id ON public.business_posts(provider_id);
CREATE INDEX IF NOT EXISTS idx_business_posts_created_at ON public.business_posts(created_at);