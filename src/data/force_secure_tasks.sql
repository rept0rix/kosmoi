-- FORCE SECURE: agent_tasks
-- This block wipes ALL existing policies on agent_tasks to ensure no hidden "Allow Public" policies remain.
DO $$
DECLARE pol record;
BEGIN FOR pol IN
SELECT policyname
FROM pg_policies
WHERE tablename = 'agent_tasks' LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.agent_tasks',
        pol.policyname
    );
END LOOP;
END $$;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
-- Policy: Authenticated users ONLY (No Anon Access)
CREATE POLICY "Enable access for authenticated users only" ON public.agent_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- FORCE SECURE: audit_logs
-- This block wipes ALL existing policies on audit_logs
DO $$
DECLARE pol record;
BEGIN FOR pol IN
SELECT policyname
FROM pg_policies
WHERE tablename = 'audit_logs' LOOP EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.audit_logs',
        pol.policyname
    );
END LOOP;
END $$;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Policy: Allow Anon to INSERT (for logs), but NOT SELECT (read).
CREATE POLICY "Allow insert for all" ON public.audit_logs FOR
INSERT TO anon,
    authenticated WITH CHECK (true);
-- Policy: Only Authenticated can VIEW logs.
CREATE POLICY "Allow view for authenticated only" ON public.audit_logs FOR
SELECT TO authenticated USING (true);