-- Create admin_personal_tasks table
CREATE TABLE IF NOT EXISTS admin_personal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'done')) DEFAULT 'pending',
    priority TEXT CHECK (
        priority IN ('low', 'medium', 'high', 'critical')
    ) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE admin_personal_tasks ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can manage their own tasks" ON admin_personal_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_admin_personal_tasks_updated_at BEFORE
UPDATE ON admin_personal_tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();