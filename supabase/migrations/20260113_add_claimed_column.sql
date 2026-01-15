-- Add missing 'claimed' column
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;