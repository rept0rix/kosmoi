-- Add missing columns for Business Profile Editor
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS whatsapp text,
    ADD COLUMN IF NOT EXISTS logo_url text,
    ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
-- Comment on columns
COMMENT ON COLUMN public.service_providers.whatsapp IS 'Direct WhatsApp number for the business';
COMMENT ON COLUMN public.service_providers.logo_url IS 'URL to the business logo image';
COMMENT ON COLUMN public.service_providers.social_links IS 'JSON object containing social media links (facebook, instagram, etc.)';