-- Fix RLS policies for business_analytics and service_providers
-- 1. Fix business_analytics read policy (change user_id to owner_id)
DROP POLICY IF EXISTS "Enable read for owners" ON "public"."business_analytics";
CREATE POLICY "Enable read for owners" ON "public"."business_analytics" FOR
SELECT USING (
        auth.uid() = (
            SELECT owner_id
            FROM service_providers
            WHERE id = provider_id
        )
    );
-- 2. Ensure service_providers has an update policy for owners
DROP POLICY IF EXISTS "Enable update for owners" ON "public"."service_providers";
CREATE POLICY "Enable update for owners" ON "public"."service_providers" FOR
UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
-- 3. Ensure service_providers has an insert policy (if they register new business)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."service_providers";
CREATE POLICY "Enable insert for authenticated users" ON "public"."service_providers" FOR
INSERT WITH CHECK (auth.uid() = owner_id);