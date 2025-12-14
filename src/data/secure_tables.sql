-- Secure agent_tasks
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
-- Remove existing policies if any (to be safe, though none detected blocking)
DROP POLICY IF EXISTS "Allow public access" ON public.agent_tasks;
-- Policy: Only authenticated users can view/insert tasks (assuming agents are auth'd or service role)
CREATE POLICY "Enable access for authenticated users only" ON public.agent_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Secure spatial_ref_sys (Read-only for public)
-- NOTE: Commenting out because 'postgres' role is not owner of this PostGIS system table.
-- It's generally safe to leave as-is if we can't modify it.
-- ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access"
-- ON public.spatial_ref_sys
-- FOR SELECT
-- TO public
-- USING (true);
-- Create profiles table if it doesn't exist (since audit failed to find it)
-- minimizing "PGRST205" errors if we expect it to be there.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    avatar_url text,
    updated_at timestamptz
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Basic Profile Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);