-- Add Rich Listing columns to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS price_packages JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
-- Comment on columns
COMMENT ON COLUMN public.service_providers.price_packages IS 'List of packages/services with price, title, description';
COMMENT ON COLUMN public.service_providers.amenities IS 'List of amenities/features (e.g. Wifi, AC, Pool)';