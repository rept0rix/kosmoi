-- ============================================================
-- FIX pg_cron: SCHEDULE THE AUTONOMOUS BRAIN (cron-worker)
-- ============================================================
--
-- HOW TO USE THIS MIGRATION:
-- 1. First, set the service_role_key in Supabase SQL Editor:
--    Run this ONCE (not in migration):
--    ALTER DATABASE postgres
--      SET app.settings.service_role_key = 'your-actual-service-role-key';
--
--    OR use the Supabase Dashboard:
--    Settings → Database → Configuration → Custom Settings
--    Key: app.settings.service_role_key
--    Value: [your service_role_key from Settings → API]
--
-- 2. Then run this migration.
--
-- WHY NOT PUT KEY IN MIGRATION:
-- Hard-coding secrets in migrations = they end up in git history = security breach.
-- ============================================================

-- Ensure pg_cron extension exists
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================
-- 1. AUTONOMOUS BRAIN (cron-worker) — Every 15 Minutes
-- ============================================================
-- This is the main autonomous decision engine.
-- It reads unprocessed signals, analyzes platform health,
-- and triggers actions (outreach, retention, payment recovery).
-- ============================================================

SELECT cron.unschedule('autonomous-brain')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'autonomous-brain'
);

SELECT cron.schedule(
    'autonomous-brain',
    '*/15 * * * *',  -- Every 15 minutes, 24/7
    $$
    SELECT net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/cron-worker',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'AUTONOMOUS_CYCLE',
            'timestamp', NOW()::text,
            'source', 'pg_cron'
        )
    ) $$
);

-- ============================================================
-- 2. DAILY STANDUP — 9:00 AM Thailand (2:00 AM UTC)
-- ============================================================
-- Re-schedule to call cron-worker (not agent-worker)
-- cron-worker is the real brain; agent-worker is browser-assistant
-- ============================================================

SELECT cron.unschedule('daily-standup')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-standup'
);

SELECT cron.schedule(
    'daily-standup',
    '0 2 * * *',  -- 2:00 AM UTC = 9:00 AM Thailand (UTC+7)
    $$
    SELECT net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/cron-worker',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'DAILY_STANDUP',
            'timestamp', NOW()::text,
            'source', 'pg_cron'
        )
    ) $$
);

-- ============================================================
-- 3. WEEKLY REPORT — Monday 8:00 AM Thailand (1:00 AM UTC)
-- ============================================================

SELECT cron.unschedule('weekly-report')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-report'
);

SELECT cron.schedule(
    'weekly-report',
    '0 1 * * 1',  -- 1:00 AM UTC Monday = 8:00 AM Thailand Monday
    $$
    SELECT net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/cron-worker',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'WEEKLY_REPORT',
            'timestamp', NOW()::text,
            'source', 'pg_cron'
        )
    ) $$
);

-- ============================================================
-- 4. RETENTION CHECK — Midnight Thailand (5:00 PM UTC)
-- ============================================================

SELECT cron.unschedule('retention-check-daily')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'retention-check-daily'
);

SELECT cron.schedule(
    'retention-check-daily',
    '0 17 * * *',  -- 5:00 PM UTC = Midnight Thailand
    $$
    SELECT net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/retention-agent',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'action', 'DAILY_RETENTION_CHECK'
        )
    ) $$
);

-- ============================================================
-- 5. SCOUT SWEEP — Every 2 Hours (find new businesses)
-- ============================================================

SELECT cron.unschedule('scout-sweep-hourly')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'scout-sweep-hourly'
);

SELECT cron.schedule(
    'scout-sweep-hourly',
    '0 */2 * * *',  -- Every 2 hours
    $$
    SELECT net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/sales-scout',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'action', 'invite_leads'
        )
    ) $$
);

-- ============================================================
-- 6. UPDATE COMPANY GOALS — Every Hour (refresh current values)
-- ============================================================
-- This keeps company_goals.current_value up to date so the brain
-- can see real-time progress toward OKRs.
-- ============================================================

SELECT cron.unschedule('update-goals-metrics')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'update-goals-metrics'
);

SELECT cron.schedule(
    'update-goals-metrics',
    '5 * * * *',  -- 5 minutes past every hour
    $$
    -- Update claimed_providers goal
    UPDATE public.company_goals
    SET current_value = (
        SELECT COUNT(*) FROM public.service_providers
        WHERE claimed = true AND status = 'active'
    ),
    updated_at = NOW()
    WHERE metric_key = 'claimed_providers';

    -- Update avg_provider_rating goal
    UPDATE public.company_goals
    SET current_value = (
        SELECT COALESCE(AVG(average_rating), 0)
        FROM public.service_providers
        WHERE claimed = true AND average_rating > 0
    ),
    updated_at = NOW()
    WHERE metric_key = 'avg_provider_rating';
    $$
);

-- ============================================================
-- 7. CLEANUP OLD LOGS — Sunday 3:00 AM Thailand
-- ============================================================

SELECT cron.unschedule('cleanup-old-logs')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-logs'
);

SELECT cron.schedule(
    'cleanup-old-logs',
    '0 20 * * 0',  -- 8:00 PM UTC Sunday = 3:00 AM Thailand Monday
    $$
    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - INTERVAL '30 days';

    DELETE FROM public.email_logs
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Keep signals for 90 days (brain needs history for learning)
    DELETE FROM public.signals
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND processed = true;
    $$
);

-- ============================================================
-- VERIFY: Show all scheduled jobs
-- ============================================================
SELECT
    jobname,
    schedule,
    active,
    jobid
FROM cron.job
ORDER BY jobname;

-- ============================================================
-- DONE
-- ============================================================
-- Scheduled jobs:
--   autonomous-brain    — Every 15 min (THE MAIN BRAIN)
--   daily-standup       — 9:00 AM Thailand daily
--   weekly-report       — Monday 8:00 AM Thailand
--   retention-check-daily — Midnight Thailand daily
--   scout-sweep-hourly  — Every 2 hours
--   update-goals-metrics — Every hour
--   cleanup-old-logs    — Sunday 3:00 AM Thailand
--
-- IMPORTANT: Before running this migration, set:
-- ALTER DATABASE postgres
--   SET app.settings.service_role_key = 'your-key';
-- (in Supabase SQL Editor, NOT in a migration file)
-- ============================================================
