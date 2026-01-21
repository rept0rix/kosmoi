-- Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID REFERENCES auth.users(id) NOT NULL,
    participant2_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message TEXT,
    product_id UUID REFERENCES marketplace_listings(id),
    -- Optional: Link to a product
    CONSTRAINT items_check CHECK (participant1_id != participant2_id)
);
-- Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'text' -- 'text', 'image', 'system'
);
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Policies for Conversations
CREATE POLICY "Users can view their own conversations" ON conversations FOR
SELECT USING (
        auth.uid() = participant1_id
        OR auth.uid() = participant2_id
    );
CREATE POLICY "Users can create conversations" ON conversations FOR
INSERT WITH CHECK (
        auth.uid() = participant1_id
        OR auth.uid() = participant2_id
    );
-- Policies for Messages
CREATE POLICY "Users can view messages in their conversations" ON messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversations
            WHERE conversations.id = messages.conversation_id
                AND (
                    conversations.participant1_id = auth.uid()
                    OR conversations.participant2_id = auth.uid()
                )
        )
    );
CREATE POLICY "Users can insert messages in their conversations" ON messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM conversations
            WHERE conversations.id = messages.conversation_id
                AND (
                    conversations.participant1_id = auth.uid()
                    OR conversations.participant2_id = auth.uid()
                )
        )
        AND auth.uid() = sender_id
    );
-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);