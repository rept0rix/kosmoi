
-- Fix agent_tasks status constraint to allow 'completed' and 'failed'
ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS agent_tasks_status_check;
ALTER TABLE agent_tasks ADD CONSTRAINT agent_tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'review', 'done', 'completed', 'failed'));

-- Fix agent_memory RLS policies
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for authenticated users" ON agent_memory
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON agent_memory
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable select for authenticated users" ON agent_memory
FOR SELECT USING (auth.uid() = user_id);

-- Ensure agent_tasks has a result column (it seemed missing in one error, though check_tasks saw it)
ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS result TEXT;
