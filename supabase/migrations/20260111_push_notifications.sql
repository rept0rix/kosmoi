-- Create table for storing Web Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint) -- Prevent duplicate subscriptions for same device/user
);
-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
-- Admins/Service Role can read all (for sending)
-- (Service role bypasses RLS, but good to be explicit for Admin user)
CREATE POLICY "Admins can read all subscriptions" ON push_subscriptions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE id = auth.uid()
                AND (
                    raw_user_meta_data->>'role' = 'admin'
                    OR raw_app_meta_data->>'role' = 'admin'
                )
        )
        OR auth.uid() = user_id -- Users can read their own
    );