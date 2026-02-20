-- Fix RLS for service_providers to allow public access to active providers
-- This fixes the "No providers found" and "permission denied for table users" errors
-- 1. Enable RLS (ensure it is on)
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
-- 2. Drop potentially conflicting or broken policies
DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON service_providers;
DROP POLICY IF EXISTS "Enable read access for all users" ON service_providers;
DROP POLICY IF EXISTS "Service Providers are viewable by everyone" ON service_providers;
DROP POLICY IF EXISTS "Allow public read access" ON service_providers;
-- 3. Create a clean, simple policy for Public Read (Anon + Authenticated)
-- Only allow viewing 'active' providers, OR if the user is the owner
CREATE POLICY "Public providers are viewable by everyone" ON service_providers FOR
SELECT USING (
        status = 'active'
        OR (
            auth.role() = 'authenticated'
            AND auth.uid() = owner_id
        )
    );
-- 4. Grant access to anon role (just in case)
GRANT SELECT ON service_providers TO anon;
GRANT SELECT ON service_providers TO authenticated;
-- 5. Repeat for reviews/favorites if needed (optional but good practice)
GRANT SELECT ON reviews TO anon;
GRANT SELECT ON favorites TO anon;