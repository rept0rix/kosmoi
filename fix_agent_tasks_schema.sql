-- Fix for Agent Tasks Table - Missing updated_at column
-- This column is required for RxDB replication to work correctly.
DO $$ BEGIN -- 1. Add updated_at column if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'agent_tasks'
        AND column_name = 'updated_at'
) THEN
ALTER TABLE agent_tasks
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END IF;
END $$;
-- 2. Create Trigger Function (if not exists - usually shared)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 3. Create Trigger for agent_tasks
DROP TRIGGER IF EXISTS update_agent_tasks_updated_at ON agent_tasks;
CREATE TRIGGER update_agent_tasks_updated_at BEFORE
UPDATE ON agent_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 4. Enable Realtime (ensure it's on)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;