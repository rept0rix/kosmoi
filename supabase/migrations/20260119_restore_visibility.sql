-- EMERGENCY FIX: Restore Visibility and Permissions
-- This script resets RLS policies to ensure businesses are visible and owners can edit.
-- ==========================================
-- 1. Table: service_providers
-- ==========================================
ALTER TABLE "public"."service_providers" ENABLE ROW LEVEL SECURITY;
-- Drop ALL known potential conflicting policies to ensure a clean state
DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON "public"."service_providers";
DROP POLICY IF EXISTS "Public Read Active Businesses" ON "public"."service_providers";
DROP POLICY IF EXISTS "Enable update for owners" ON "public"."service_providers";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."service_providers";
DROP POLICY IF EXISTS "Owner Manage Business" ON "public"."service_providers";
DROP POLICY IF EXISTS "Authenticated Insert Business" ON "public"."service_providers";
DROP POLICY IF EXISTS "Public Read Active" ON "public"."service_providers";
DROP POLICY IF EXISTS "Owner Update" ON "public"."service_providers";
DROP POLICY IF EXISTS "Owner Insert" ON "public"."service_providers";
-- POLICY A: READ (SELECT)
-- Public can see 'active' and 'new_lead' businesses.
-- Owners can see their own business regardless of status.
CREATE POLICY "Public Read Active" ON "public"."service_providers" FOR
SELECT USING (
        status IN ('active', 'new_lead')
        OR (auth.uid() = owner_id)
    );
-- POLICY B: UPDATE
-- Owners can update their own business.
CREATE POLICY "Owner Update" ON "public"."service_providers" FOR
UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
-- POLICY C: INSERT
-- Authenticated users can create a new business (and become its owner).
CREATE POLICY "Owner Insert" ON "public"."service_providers" FOR
INSERT WITH CHECK (auth.uid() = owner_id);
-- POLICY D: DELETE
-- Owners can delete their own business (optional, but good to have).
DROP POLICY IF EXISTS "Owner Delete" ON "public"."service_providers";
CREATE POLICY "Owner Delete" ON "public"."service_providers" FOR DELETE USING (auth.uid() = owner_id);
-- ==========================================
-- 2. Table: business_analytics
-- ==========================================
ALTER TABLE "public"."business_analytics" ENABLE ROW LEVEL SECURITY;
-- Drop known policies
DROP POLICY IF EXISTS "Enable read for owners" ON "public"."business_analytics";
-- POLICY: READ (SELECT)
-- Owners can read analytics for their own business.
CREATE POLICY "Enable read for owners" ON "public"."business_analytics" FOR
SELECT USING (
        auth.uid() IN (
            SELECT owner_id
            FROM service_providers
            WHERE id = business_analytics.provider_id
        )
    );
-- POLICY: INSERT (RPC/System usually handles this, but allowing authenticated for tracking)
-- Assuming events are inserted by the backend or via RPC, but if frontend does it directly:
DROP POLICY IF EXISTS "Enable insert for analytics" ON "public"."business_analytics";
CREATE POLICY "Enable insert for analytics" ON "public"."business_analytics" FOR
INSERT WITH CHECK (
        -- Allow any authenticated user to log an event? Or restricting?
        -- Usually analytics are logged by the system/public via RPC.
        -- If using direct insert from client:
        true
    );
-- Force schema cache reload
NOTIFY pgrst,
'reload config';