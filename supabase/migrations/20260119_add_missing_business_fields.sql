-- Add missing columns for Business Profile Editor (Product Menu, Hours, Location, etc.)
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS price_packages jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS price_range text DEFAULT 'moderate',
    ADD COLUMN IF NOT EXISTS emergency_service boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS latitude numeric,
    ADD COLUMN IF NOT EXISTS longitude numeric;
COMMENT ON COLUMN public.service_providers.price_packages IS 'List of products/services with title, price, description';
COMMENT ON COLUMN public.service_providers.opening_hours IS 'Structured opening hours data';