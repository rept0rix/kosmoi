-- ==============================================================================
-- KOSMOI MASTER SECURITY HARDENING
-- ==============================================================================
-- This script performs a total lockdown of the database.
-- It ensures RLS is enabled on all tables and applies strict policies.

-- 0. GLOBAL RESET: Drop existing broad policies to avoid conflicts
DO $$ 
BEGIN
    -- profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    
    -- service_providers
    DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON service_providers;
    DROP POLICY IF EXISTS "Allow anon insert for onboarding" ON service_providers;
    DROP POLICY IF EXISTS "Anyone can view active service providers" ON service_providers;
    DROP POLICY IF EXISTS "Authenticated users can create providers" ON service_providers;
    DROP POLICY IF EXISTS "Users can update their own providers" ON service_providers;
    DROP POLICY IF EXISTS "Users can delete their own providers" ON service_providers;

    -- bookings
    DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
    DROP POLICY IF EXISTS "Users can insert bookings" ON bookings;

    -- agent_memory
    DROP POLICY IF EXISTS "Users can view their own agent memory" ON agent_memory;
    DROP POLICY IF EXISTS "Users can insert/update their own agent memory" ON agent_memory;
    DROP POLICY IF EXISTS "Users can update their own agent memory" ON agent_memory;

    -- audit_logs
    DROP POLICY IF EXISTS "Only authenticated can insert audit logs" ON audit_logs;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some policies could not be dropped, likely due to tables not existing yet.';
END $$;

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS search_history ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES: Strict Self-Only
CREATE POLICY "Profiles: Self-Only View" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: Self-Only Update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. SERVICE PROVIDERS: Public Reading, Authenticated Management
-- Active providers are public
CREATE POLICY "Providers: Public View Active" ON service_providers FOR SELECT USING (status = 'active');
-- Authenticated users can see their own (even if pending/rejected)
CREATE POLICY "Providers: View Own" ON service_providers FOR SELECT TO authenticated USING (auth.uid()::text = created_by);
-- Authenticated users can create
CREATE POLICY "Providers: Authenticated Create" ON service_providers FOR INSERT TO authenticated WITH CHECK (true);
-- Owners can update
CREATE POLICY "Providers: Owner Update" ON service_providers FOR UPDATE TO authenticated USING (auth.uid()::text = created_by);

-- 4. BOOKINGS: Self-Only
CREATE POLICY "Bookings: Self-Only View" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Bookings: Self-Only Insert" ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. AGENT MEMORY & TASKS
CREATE POLICY "Agent Memory: Self-Only View" ON agent_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agent Memory: Self-Only Manage" ON agent_memory FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Agent Tasks: Participant View" ON agent_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agent Tasks: Participant Manage" ON agent_tasks FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 6. REVIEWS
CREATE POLICY "Reviews: Public View" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviews: Self Management" ON reviews FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 7. AUDIT LOGS: Append Only for Authenticated
CREATE POLICY "Audit Logs: Authenticated Insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
-- No Select for anyone except Service Role (implicit)

-- 8. SEARCH HISTORY: Private
CREATE POLICY "Search History: Self-Only" ON search_history FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 9. FAVORITES: Private
CREATE POLICY "Favorites: Self-Only" ON favorites FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 10. SPATIAL_REF_SYS (PostGIS system table)
-- Usually should be readable by everyone
ALTER TABLE IF EXISTS spatial_ref_sys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select" ON spatial_ref_sys;
CREATE POLICY "Public Select" ON spatial_ref_sys FOR SELECT USING (true);
