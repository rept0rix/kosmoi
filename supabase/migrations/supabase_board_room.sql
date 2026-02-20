-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Board Meetings Table
CREATE TABLE IF NOT EXISTS board_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'archived', 'paused')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    summary TEXT
);
-- 2. Board Participants Table
CREATE TABLE IF NOT EXISTS board_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES board_meetings(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, agent_id)
);
-- 3. Board Messages Table
CREATE TABLE IF NOT EXISTS board_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES board_meetings(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (
        type IN ('text', 'proposal', 'vote', 'task_created')
    ) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    -- Agent ID or 'HUMAN_USER'
    status TEXT CHECK (
        status IN ('pending', 'in_progress', 'review', 'done')
    ) DEFAULT 'pending',
    priority TEXT CHECK (
        priority IN ('low', 'medium', 'high', 'critical')
    ) DEFAULT 'medium',
    created_by TEXT,
    meeting_id UUID REFERENCES board_meetings(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable Row Level Security (RLS)
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
-- Create policies (Allow all for now for development simplicity, or restrict as needed)
-- In a real app, you'd restrict based on user_id if these were user-specific boards.
-- Assuming this is a single-tenant or admin-only tool for now:
CREATE POLICY "Enable read access for all users" ON board_meetings FOR
SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON board_meetings FOR
INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON board_meetings FOR
UPDATE USING (true);
CREATE POLICY "Enable read access for all users" ON board_participants FOR
SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON board_participants FOR
INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON board_messages FOR
SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON board_messages FOR
INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON agent_tasks FOR
SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agent_tasks FOR
INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agent_tasks FOR
UPDATE USING (true);
-- Enable Realtime for these tables
alter publication supabase_realtime
add table board_meetings;
alter publication supabase_realtime
add table board_messages;
alter publication supabase_realtime
add table agent_tasks;
-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    -- Nullable for now if guest bookings are needed, but ideally linked to auth
    provider_id TEXT NOT NULL,
    service_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    service_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- RLS for Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own bookings" ON bookings FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own bookings" ON bookings FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their own bookings" ON bookings FOR
UPDATE USING (auth.uid() = user_id);
-- Enable Realtime for bookings (optional, but good for instant updates)
alter publication supabase_realtime
add table bookings;