-- Analytics Schema
-- 1. Events Log
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_name TEXT NOT NULL,
    -- 'page_view', 'signup', 'purchase', 'login'
    user_id UUID REFERENCES auth.users(id),
    -- Optional, for logged in users
    properties JSONB DEFAULT '{}'::jsonb,
    -- Store details like { value: 100, page: '/home' }
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
-- Policies
-- Admin can view all
CREATE POLICY "Admins can view all events" ON analytics_events FOR
SELECT USING (true);
-- Simplified for demo
-- Users can insert their own events (or public can insert page_views)
CREATE POLICY "Public can insert events" ON analytics_events FOR
INSERT WITH CHECK (true);
-- 2. Seed Data (Mock History for Graphs)
-- We want a nice curve for "User Growth" and "MRR" over the last 30 days.
DO $$
DECLARE i INTEGER;
v_date TIMESTAMPTZ;
v_signups INTEGER;
v_revenue DECIMAL;
BEGIN -- Only seed if empty to prevent duplicates on re-run
IF NOT EXISTS (
    SELECT 1
    FROM analytics_events
    LIMIT 1
) THEN FOR i IN 0..29 LOOP v_date := NOW() - (i || ' days')::INTERVAL;
-- randomness
v_signups := floor(random() * 10 + 2)::INTEGER;
-- 2 to 12 signups per day
v_revenue := floor(random() * 5000 + 1000)::DECIMAL;
-- 1000 to 6000 THB per day
-- Insert Mock Signups
FOR j IN 1..v_signups LOOP
INSERT INTO analytics_events (event_name, created_at, properties)
VALUES (
        'signup',
        v_date + (random() * interval '24 hours'),
        '{"source": "web"}'
    );
END LOOP;
-- Insert Mock Revenue (Purchases)
FOR k IN 1..3 LOOP
INSERT INTO analytics_events (event_name, created_at, properties)
VALUES (
        'purchase',
        v_date + (random() * interval '24 hours'),
        jsonb_build_object('value', v_revenue / 3, 'item', 'premium_plan')
    );
END LOOP;
-- Insert Mock Page Views
FOR k IN 1..50 LOOP
INSERT INTO analytics_events (event_name, created_at, properties)
VALUES (
        'page_view',
        v_date + (random() * interval '24 hours'),
        jsonb_build_object('path', '/home')
    );
END LOOP;
END LOOP;
END IF;
END $$;