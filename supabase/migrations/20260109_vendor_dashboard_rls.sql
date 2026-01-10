-- Comprehensive Vendor Dashboard Migration
-- 1. Ensure Columns Exist (Idempotent)
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS price_packages JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS images TEXT [] DEFAULT '{}'::text [],
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT;
-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_service_providers_owner_id ON public.service_providers(owner_id);
-- 3. Backfill owner_id (Idempotent)
DO $$ BEGIN
UPDATE public.service_providers
SET owner_id = created_by::uuid
WHERE owner_id IS NULL
    AND created_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Skipping backfill due to error';
END $$;
-- 4. Secure RLS Policies
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner Manage Business" ON service_providers;
CREATE POLICY "Owner Manage Business" ON service_providers FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
-- 5. Grant Permissions on specific columns
GRANT UPDATE (
        business_name,
        description,
        logo_url,
        images,
        price_packages,
        amenities,
        phone_number,
        email,
        website,
        location
    ) ON public.service_providers TO authenticated;
-- 6. Insert Policy Validation
DROP POLICY IF EXISTS "Public Insert Business" ON service_providers;
DROP POLICY IF EXISTS "Authenticated Insert Business" ON service_providers;
CREATE POLICY "Authenticated Insert Business" ON service_providers FOR
INSERT TO authenticated WITH CHECK (
        auth.uid() = owner_id
        AND (
            status = 'pending'
            OR status = 'new_lead'
        )
    );
-- 7. Public Read Policy (Ensure it exists)
DROP POLICY IF EXISTS "Public Read Active Businesses" ON service_providers;
CREATE POLICY "Public Read Active Businesses" ON service_providers FOR
SELECT TO public USING (status IN ('active', 'new_lead'));