-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;
CREATE POLICY "Reviews are public" ON public.reviews FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can review" ON public.reviews;
CREATE POLICY "Authenticated users can review" ON public.reviews FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can edit own reviews" ON public.reviews;
CREATE POLICY "Users can edit own reviews" ON public.reviews FOR
UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Add aggregated columns to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) DEFAULT 0;
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
-- Function to update provider stats
CREATE OR REPLACE FUNCTION update_provider_rating_stats() RETURNS TRIGGER AS $$
DECLARE target_provider_id UUID;
BEGIN IF (TG_OP = 'DELETE') THEN target_provider_id := OLD.provider_id;
ELSE target_provider_id := NEW.provider_id;
END IF;
UPDATE public.service_providers
SET average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE provider_id = target_provider_id
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE provider_id = target_provider_id
    )
WHERE id = target_provider_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_provider_rating_stats();