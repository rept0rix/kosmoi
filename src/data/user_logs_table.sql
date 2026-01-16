-- Create table for user activity logs
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
-- Allow users to insert their own logs
-- We use a simpler policy to avoid recursion issues if possible, but matching uid is standard.
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_activity_logs;
CREATE POLICY "Users can insert their own logs" ON public.user_activity_logs FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Allow users to read their own logs
DROP POLICY IF EXISTS "Users can read their own logs" ON public.user_activity_logs;
CREATE POLICY "Users can read their own logs" ON public.user_activity_logs FOR
SELECT TO authenticated USING (auth.uid() = user_id);
-- Allow Admins to read ALL logs
-- Matches the role check used in AuthContext/AdminService
DROP POLICY IF EXISTS "Admins can read all logs" ON public.user_activity_logs;
CREATE POLICY "Admins can read all logs" ON public.user_activity_logs FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );