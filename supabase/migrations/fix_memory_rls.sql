
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agent_memory;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON agent_memory;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON agent_memory;

-- Create permissive policies (since this is an internal tool for now)
-- Allowing all operations for now to unblock the worker
CREATE POLICY "Enable all for public" ON agent_memory
FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled (or disabled if we want zero friction)
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
