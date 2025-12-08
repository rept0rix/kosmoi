-- Enable RLS on tables (just to be safe, though likely already enabled)
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (optional, but good for cleanup)
DROP POLICY IF EXISTS "Allow public access" ON board_meetings;
DROP POLICY IF EXISTS "Allow public access" ON board_messages;
DROP POLICY IF EXISTS "Allow public access" ON agent_tasks;

-- Create permissive policies for the prototype (Allow ALL operations for anon/public)
-- WARNING: This is for development only. For production, restrict this!

-- 1. Board Meetings
CREATE POLICY "Enable all access for board_meetings"
ON board_meetings
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 2. Board Messages
CREATE POLICY "Enable all access for board_messages"
ON board_messages
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 3. Agent Tasks
CREATE POLICY "Enable all access for agent_tasks"
ON agent_tasks
FOR ALL
TO public
USING (true)
WITH CHECK (true);
