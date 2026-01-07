-- Add owner_id to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
-- Add index
CREATE INDEX IF NOT EXISTS idx_service_providers_owner_id ON public.service_providers(owner_id);
-- Optional: Backfill owner_id from created_by if it holds a UUID
-- We use a DO block to safe cast
DO $$ BEGIN
UPDATE public.service_providers
SET owner_id = created_by::uuid
WHERE owner_id IS NULL
    AND created_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
EXCEPTION
WHEN OTHERS THEN -- Ignore casting errors
RAISE NOTICE 'Skipping backfill due to error or invalid UUIDs';
END $$;