-- Seed Data for Analytics Events (For Optimizer Testing)
-- Ensure table exists (if not created by Supabase Auth hooks or another migration)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT
);
-- Enable RLS just in case
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON analytics_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Insert Mock Data for last 30 days
-- Goals: Low conversion rate to trigger "Pricing Opportunity" insight
-- 1. Lots of Traffic (Page Views)
INSERT INTO analytics_events (event_name, properties, created_at)
SELECT 'page_view',
    '{"path": "/"}'::jsonb,
    NOW() - (random() * interval '30 days')
FROM generate_series(1, 1000);
-- 2. Some Signups (15 signups / 1000 views = 1.5% conversion - LOW!)
INSERT INTO analytics_events (event_name, properties, created_at)
SELECT 'signup',
    '{"method": "email"}'::jsonb,
    NOW() - (random() * interval '30 days')
FROM generate_series(1, 15);
-- 3. Few Purchases
INSERT INTO analytics_events (event_name, properties, created_at)
SELECT 'purchase',
    '{"value": 29.00, "plan": "starter"}'::jsonb,
    NOW() - (random() * interval '30 days')
FROM generate_series(1, 5);