-- Create table for storing raw memories and summaries
CREATE TABLE IF NOT EXISTS ai_memories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID,
    -- Optional: if a specific agent "remembers" this
    memory_type TEXT NOT NULL CHECK (
        memory_type IN (
            'conversation_summary',
            'fact',
            'preference',
            'interaction_log'
        )
    ),
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    -- Store related metadata (e.g., topic, sentiment)
    importance_score FLOAT DEFAULT 0.5,
    -- 0.0 to 1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS for ai_memories
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own memories" ON ai_memories FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memories" ON ai_memories FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON ai_memories FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON ai_memories FOR DELETE USING (auth.uid() = user_id);
-- Create table for extracted structured traits
CREATE TABLE IF NOT EXISTS ai_traits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trait_key TEXT NOT NULL,
    -- e.g., "coding_style", "communication_tone"
    trait_value TEXT NOT NULL,
    -- e.g., "functional", "formal"
    category TEXT DEFAULT 'general',
    confidence_score FLOAT DEFAULT 0.0,
    source_memory_id UUID REFERENCES ai_memories(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, trait_key) -- Prevent duplicate traits for the same user
);
-- Enable RLS for ai_traits
ALTER TABLE ai_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own traits" ON ai_traits FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own traits" ON ai_traits FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own traits" ON ai_traits FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own traits" ON ai_traits FOR DELETE USING (auth.uid() = user_id);
-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_ai_memories_updated_at BEFORE
UPDATE ON ai_memories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ai_traits_updated_at BEFORE
UPDATE ON ai_traits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();