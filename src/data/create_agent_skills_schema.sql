-- Agent Skills Table for Context Engineering (Organizational Memory)
CREATE TABLE IF NOT EXISTS agent_skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL,
    -- 'coding', 'business', 'process', 'communication'
    trigger_tags TEXT [],
    -- Keywords for vector-like search (postgres array overlap)
    problem_pattern TEXT,
    -- "RLS 401 Error on Analytics Table"
    solution_pattern TEXT,
    -- "Enable RLS and add Policy for authenticated users"
    confidence DECIMAL(3, 2) DEFAULT 0.8,
    -- 0.0 to 1.0
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    -- or NULL for System
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
-- Policies
-- Read: All authenticated agents/users can read skills
CREATE POLICY "Enable read access for authenticated users" ON agent_skills FOR
SELECT USING (auth.role() = 'authenticated');
-- Write: All authenticated agents/users can write (or restrict to admins if needed, but for now open)
CREATE POLICY "Enable insert access for authenticated users" ON agent_skills FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Update: Allow updating usage_count
CREATE POLICY "Enable update access for authenticated users" ON agent_skills FOR
UPDATE USING (auth.role() = 'authenticated');
-- Seed a sample skill (The "Hello World" of Context Engineering)
INSERT INTO agent_skills (
        category,
        trigger_tags,
        problem_pattern,
        solution_pattern,
        confidence
    )
VALUES (
        'coding',
        ARRAY ['supabase', 'rls', '401', 'error'],
        'Supabase returns 401 Unauthorized even when logged in',
        'Check if Row Level Security (RLS) is enabled on the table. If enabled, ensure a Policy exists that grants "SELECT" permission to "authenticated" role.',
        1.0
    );