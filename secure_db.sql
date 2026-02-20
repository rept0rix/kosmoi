-- 🔒 Secure Database: Lock down access to authenticated users only

-- 1. Board Meetings
DROP POLICY IF EXISTS "Enable read access for all users" ON board_meetings;
DROP POLICY IF EXISTS "Enable insert access for all users" ON board_meetings;
DROP POLICY IF EXISTS "Enable update access for all users" ON board_meetings;

CREATE POLICY "Allow authenticated read" ON board_meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON board_meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON board_meetings FOR UPDATE TO authenticated USING (true);

-- 2. Board Participants
DROP POLICY IF EXISTS "Enable read access for all users" ON board_participants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON board_participants;

CREATE POLICY "Allow authenticated read" ON board_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON board_participants FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Board Messages
DROP POLICY IF EXISTS "Enable read access for all users" ON board_messages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON board_messages;

CREATE POLICY "Allow authenticated read" ON board_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON board_messages FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Agent Tasks
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_tasks;
DROP POLICY IF EXISTS "Enable insert access for all users" ON agent_tasks;
DROP POLICY IF EXISTS "Enable update access for all users" ON agent_tasks;

CREATE POLICY "Allow authenticated read" ON agent_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON agent_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON agent_tasks FOR UPDATE TO authenticated USING (true);

-- Note: Service Role (Agents) bypasses RLS automatically, so they will still have full access.
