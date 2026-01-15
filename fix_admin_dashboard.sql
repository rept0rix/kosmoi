-- Fix Admin Dashboard Access
-- We want authenticated users (Admin) to see ALL providers, not just active ones.
-- 1. Ensure RLS is enabled
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON service_providers;
DROP POLICY IF EXISTS "Enable read access for all users" ON service_providers;
DROP POLICY IF EXISTS "Service Providers are viewable by everyone" ON service_providers;
DROP POLICY IF EXISTS "Allow public read access" ON service_providers;
-- 3. Create permissive policies for Dashboard visibility
-- Authenticated users (Admin/Owners) can see EVERYTHING
CREATE POLICY "Authenticated users can see all providers" ON service_providers FOR
SELECT TO authenticated USING (true);
-- Public (Anon) can only see ACTIVE providers
CREATE POLICY "Public can see active providers" ON service_providers FOR
SELECT TO anon USING (status = 'active');
-- 4. Grant access
GRANT SELECT ON service_providers TO authenticated;
GRANT SELECT ON service_providers TO anon;
-- 5. Fix Agent Tasks visibility (for Live Feed)
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can see tasks" ON agent_tasks FOR
SELECT TO authenticated USING (true);
GRANT SELECT ON agent_tasks TO authenticated;
-- 6. Ensure Users table is visible to Admin
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can see users" ON users FOR
SELECT TO authenticated USING (true);
GRANT SELECT ON users TO authenticated;