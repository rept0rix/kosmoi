-- 1. Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$ BEGIN -- Check public.users table for role='admin'
    -- Assumes public.users table is synced with auth.users or manually managed
    RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Secure business_claims table
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;
-- Remove old potentially weak policies
DROP POLICY IF EXISTS "Enable read all for authenticated (Admin view)" ON business_claims;
DROP POLICY IF EXISTS "Enable insert for all users" ON business_claims;
DROP POLICY IF EXISTS "Enable select for own claims" ON business_claims;
DROP POLICY IF EXISTS "Admins can view all claims" ON business_claims;
DROP POLICY IF EXISTS "Authenticated users can create claims" ON business_claims;
DROP POLICY IF EXISTS "Users can view own claims" ON business_claims;
-- New Policies
-- A. Admins can do EVERYTHING on claims
CREATE POLICY "Admins can do everything on claims" ON business_claims FOR ALL USING (is_admin());
-- B. Authenticated users can INSERT claims
CREATE POLICY "Authenticated users can insert claims" ON business_claims FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- C. Users can VIEW their own claims
CREATE POLICY "Users can view own claims" ON business_claims FOR
SELECT USING (auth.uid() = user_id);
-- D. Users (Connect) implies maybe they need to update? 
-- Usually only Admin approves, so users don't update status.
-- But if they need to cancel?
CREATE POLICY "Users can update own pending claims" ON business_claims FOR
UPDATE USING (
        auth.uid() = user_id
        AND status = 'pending'
    );
-- 3. Secure users table (if not already)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Basic user policy: Everyone can see basic info (for profiles), but only Admins can edit roles
-- (Assuming existing policies might complicate, we'll just add the admin one for now)
-- Policy: Admins can update users (e.g. roles, bans)
CREATE POLICY "Admins can update all users" ON users FOR
UPDATE USING (is_admin());
-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (is_admin());