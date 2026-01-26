-- ============================================
-- KOSMOI SCHEDULED JOBS (pg_cron)
-- ============================================
-- Run this SQL in Supabase SQL Editor to enable scheduled automation
-- 
-- IMPORTANT: You need to enable pg_cron in your Supabase project first:
-- 1. Go to Database → Extensions
-- 2. Search for "pg_cron" and enable it
-- ============================================
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Allow jobs to be scheduled
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
-- ============================================
-- STORE SERVICE ROLE KEY FOR TRIGGERS
-- ============================================
-- Note: Replace 'YOUR_SERVICE_ROLE_KEY' with your actual key
-- This allows database triggers to call Edge Functions with proper auth
-- First, check if the setting exists
DO $$ BEGIN -- Set the key (replace with your actual key)
-- You can also do this via:
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_KEY';
PERFORM set_config(
    'app.settings.service_role_key',
    'YOUR_SERVICE_ROLE_KEY_HERE',
    false
);
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Could not set service role key: %',
SQLERRM;
END;
$$;
-- ============================================
-- 1. DAILY STANDUP (9:00 AM Thailand Time, UTC+7)
-- Runs daily at 2:00 AM UTC (= 9:00 AM Thailand)
-- ============================================
SELECT cron.unschedule('daily-standup')
WHERE EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'daily-standup'
    );
SELECT cron.schedule(
        'daily-standup',
        '0 2 * * *',
        -- 2:00 AM UTC = 9:00 AM Thailand
        $$
        SELECT net.http_post(
                url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/agent-worker',
                headers := jsonb_build_object(
                    'Content-Type',
                    'application/json',
                    'Authorization',
                    'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'type',
                    'DAILY_STANDUP',
                    'timestamp',
                    NOW()::text
                )
            ) $$
    );
-- ============================================
-- 2. RETENTION CHECK (Midnight Thailand Time)
-- Runs daily at 5:00 PM UTC (= Midnight Thailand)
-- ============================================
SELECT cron.unschedule('retention-check-daily')
WHERE EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'retention-check-daily'
    );
SELECT cron.schedule(
        'retention-check-daily',
        '0 17 * * *',
        -- 5:00 PM UTC = Midnight Thailand
        $$
        SELECT net.http_post(
                url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/retention-agent',
                headers := jsonb_build_object(
                    'Content-Type',
                    'application/json',
                    'Authorization',
                    'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'action',
                    'DAILY_RETENTION_CHECK'
                )
            ) $$
    );
-- ============================================
-- 3. SCOUT SWEEP (Every 2 Hours)
-- Scans for new businesses to add to the platform
-- ============================================
SELECT cron.unschedule('scout-sweep-hourly')
WHERE EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'scout-sweep-hourly'
    );
SELECT cron.schedule(
        'scout-sweep-hourly',
        '0 */2 * * *',
        -- Every 2 hours
        $$
        SELECT net.http_post(
                url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/sales-scout',
                headers := jsonb_build_object(
                    'Content-Type',
                    'application/json',
                    'Authorization',
                    'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'action',
                    'SCAN_NEW_BUSINESSES'
                )
            ) $$
    );
-- ============================================
-- 4. WEEKLY REPORT (Every Monday at 8:00 AM Thailand)
-- Generates weekly performance summary
-- ============================================
SELECT cron.unschedule('weekly-report')
WHERE EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'weekly-report'
    );
SELECT cron.schedule(
        'weekly-report',
        '0 1 * * 1',
        -- 1:00 AM UTC Monday = 8:00 AM Thailand Monday
        $$
        SELECT net.http_post(
                url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/agent-worker',
                headers := jsonb_build_object(
                    'Content-Type',
                    'application/json',
                    'Authorization',
                    'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'type',
                    'WEEKLY_REPORT',
                    'timestamp',
                    NOW()::text
                )
            ) $$
    );
-- ============================================
-- 5. CLEANUP OLD LOGS (Weekly, Sunday at 3:00 AM Thailand)
-- ============================================
SELECT cron.unschedule('cleanup-old-logs')
WHERE EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'cleanup-old-logs'
    );
SELECT cron.schedule(
        'cleanup-old-logs',
        '0 20 * * 0',
        -- 8:00 PM UTC Sunday = 3:00 AM Thailand Monday
        $$ -- Delete activity logs older than 30 days
        DELETE FROM activity_logs
        WHERE created_at < NOW() - INTERVAL '30 days';
-- Delete email logs older than 90 days
DELETE FROM email_logs
WHERE created_at < NOW() - INTERVAL '90 days';
-- Delete analytics events older than 90 days
DELETE FROM analytics_events
WHERE created_at < NOW() - INTERVAL '90 days';
$$
);
-- ============================================
-- VERIFY SCHEDULED JOBS
-- ============================================
-- List all scheduled jobs
SELECT jobid,
    jobname,
    schedule,
    active,
    nodename
FROM cron.job
ORDER BY jobname;
-- ============================================
-- HELPER TABLE FOR EMAIL LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    template TEXT,
    email TEXT NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'sent',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
-- ============================================
-- HELPER TABLE FOR AGENT DECISIONS
-- ============================================
CREATE TABLE IF NOT EXISTS agent_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    context JSONB,
    action JSONB,
    result JSONB,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_type ON agent_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON agent_decisions(created_at DESC);
-- ============================================
-- DONE!
-- ============================================
-- Scheduled jobs created:
-- 1. daily-standup - 9:00 AM Thailand daily
-- 2. retention-check-daily - Midnight Thailand daily
-- 3. scout-sweep-hourly - Every 2 hours
-- 4. weekly-report - Monday 8:00 AM Thailand
-- 5. cleanup-old-logs - Sunday 3:00 AM Thailand
--
-- Helper tables created:
-- - email_logs
-- - agent_decisions
-- ============================================
-- Show success message
DO $$ BEGIN RAISE NOTICE '✅ Scheduled jobs created successfully!';
RAISE NOTICE 'Jobs: daily-standup, retention-check-daily, scout-sweep-hourly, weekly-report, cleanup-old-logs';
END;
$$;