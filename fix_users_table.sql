-- Create public users table to mirror auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid() = id);
-- Trigger to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, email, full_name, role)
VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    );
-- Also ensure user_roles has an entry if you use that table too
-- (Assuming user_roles table exists based on AuthContext code, but let's be safe)
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Backfill existing users
INSERT INTO public.users (id, email, full_name, role)
SELECT id,
    email,
    raw_user_meta_data->>'full_name',
    COALESCE(raw_user_meta_data->>'role', 'user')
FROM auth.users ON CONFLICT (id) DO NOTHING;