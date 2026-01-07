-- Add missing column
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;