-- ============================================
-- KOSMOI AUTOMATION TRIGGERS
-- ============================================
-- Run this SQL in Supabase SQL Editor to enable automation
-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
-- ============================================
-- 1. TRIGGER: NEW USER → SEND WELCOME EMAIL
-- ============================================
CREATE OR REPLACE FUNCTION trigger_welcome_email() RETURNS TRIGGER AS $$
DECLARE payload jsonb;
request_id bigint;
edge_function_url text;
service_role_key text;
BEGIN -- Get the Edge Function URL (replace with your project URL)
edge_function_url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/send-email';
-- Note: Service role key should be stored as a database config
-- For now, we'll use the anon key setting if available
service_role_key := current_setting('app.settings.service_role_key', true);
-- Construct email payload
payload := jsonb_build_object(
    'to',
    NEW.email,
    'template',
    'welcome',
    'data',
    jsonb_build_object(
        'name',
        COALESCE(NEW.full_name, NEW.email)
    )
);
-- Send HTTP request to Edge Function
SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type',
            'application/json',
            'Authorization',
            'Bearer ' || service_role_key
        ),
        body := payload
    ) INTO request_id;
RAISE NOTICE 'Welcome email triggered for user %',
NEW.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger on users table
DROP TRIGGER IF EXISTS "trigger_user_welcome_email" ON "users";
CREATE TRIGGER "trigger_user_welcome_email"
AFTER
INSERT ON "users" FOR EACH ROW EXECUTE FUNCTION trigger_welcome_email();
-- ============================================
-- 2. TRIGGER: NEW LEAD → NOTIFY BUSINESS OWNER
-- ============================================
CREATE OR REPLACE FUNCTION trigger_lead_notification() RETURNS TRIGGER AS $$
DECLARE payload jsonb;
request_id bigint;
edge_function_url text;
service_role_key text;
business_owner_email text;
business_name text;
BEGIN edge_function_url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/send-email';
service_role_key := current_setting('app.settings.service_role_key', true);
-- Get business owner's email and name
SELECT u.email,
    sp.business_name INTO business_owner_email,
    business_name
FROM service_providers sp
    LEFT JOIN users u ON sp.owner_id = u.id
WHERE sp.id = NEW.business_id;
-- If we found an email, send notification
IF business_owner_email IS NOT NULL THEN payload := jsonb_build_object(
    'to',
    business_owner_email,
    'template',
    'lead_notification',
    'data',
    jsonb_build_object(
        'businessName',
        business_name,
        'leadName',
        COALESCE(
            NEW.first_name || ' ' || NEW.last_name,
            NEW.company,
            'לקוח חדש'
        ),
        'leadType',
        COALESCE(NEW.type, 'general')
    )
);
SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type',
            'application/json',
            'Authorization',
            'Bearer ' || service_role_key
        ),
        body := payload
    ) INTO request_id;
RAISE NOTICE 'Lead notification sent to %',
business_owner_email;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger on leads table
DROP TRIGGER IF EXISTS "trigger_new_lead_notification" ON "leads";
CREATE TRIGGER "trigger_new_lead_notification"
AFTER
INSERT ON "leads" FOR EACH ROW EXECUTE FUNCTION trigger_lead_notification();
-- ============================================
-- 3. TRIGGER: AGENT WORKER (Enhanced)
-- Fires on multiple tables for automation
-- ============================================
CREATE OR REPLACE FUNCTION trigger_agent_worker() RETURNS TRIGGER AS $$
DECLARE payload jsonb;
request_id bigint;
edge_function_url text;
service_role_key text;
BEGIN edge_function_url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/agent-worker';
service_role_key := current_setting('app.settings.service_role_key', true);
-- Construct payload matching the format agent-worker expects
payload := jsonb_build_object(
    'type',
    TG_OP,
    'table',
    TG_TABLE_NAME,
    'schema',
    TG_TABLE_SCHEMA,
    'record',
    CASE
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
    END,
    'old_record',
    CASE
        WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)
        ELSE NULL
    END
);
-- Send HTTP request to Edge Function
SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type',
            'application/json',
            'Authorization',
            'Bearer ' || service_role_key
        ),
        body := payload
    ) INTO request_id;
RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger for service_providers (existing, recreated)
DROP TRIGGER IF EXISTS "synapse-sales-trigger" ON "service_providers";
CREATE TRIGGER "synapse-sales-trigger"
AFTER
INSERT ON "service_providers" FOR EACH ROW EXECUTE FUNCTION trigger_agent_worker();
-- Trigger for board_messages (chat)
DROP TRIGGER IF EXISTS "synapse-chat-trigger" ON "board_messages";
CREATE TRIGGER "synapse-chat-trigger"
AFTER
INSERT ON "board_messages" FOR EACH ROW EXECUTE FUNCTION trigger_agent_worker();
-- Trigger for subscriptions (trial tracking)
DROP TRIGGER IF EXISTS "synapse-subscription-trigger" ON "subscriptions";
CREATE TRIGGER "synapse-subscription-trigger"
AFTER
INSERT
    OR
UPDATE ON "subscriptions" FOR EACH ROW EXECUTE FUNCTION trigger_agent_worker();
-- ============================================
-- 4. ACTIVITY LOGGING TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION log_activity() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO activity_logs (
        table_name,
        record_id,
        action,
        user_id,
        old_data,
        new_data
    )
VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::text,
        TG_OP,
        COALESCE(
            current_setting('request.jwt.claim.sub', true),
            auth.uid()::text
        ),
        CASE
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
            ELSE NULL
        END
    );
RETURN COALESCE(NEW, OLD);
EXCEPTION
WHEN OTHERS THEN -- Don't fail the main operation if logging fails
RAISE WARNING 'Activity logging failed: %',
SQLERRM;
RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add activity logging to key tables
DROP TRIGGER IF EXISTS "log_users_activity" ON "users";
CREATE TRIGGER "log_users_activity"
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON "users" FOR EACH ROW EXECUTE FUNCTION log_activity();
DROP TRIGGER IF EXISTS "log_leads_activity" ON "leads";
CREATE TRIGGER "log_leads_activity"
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON "leads" FOR EACH ROW EXECUTE FUNCTION log_activity();
DROP TRIGGER IF EXISTS "log_service_providers_activity" ON "service_providers";
CREATE TRIGGER "log_service_providers_activity"
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON "service_providers" FOR EACH ROW EXECUTE FUNCTION log_activity();
-- ============================================
-- 5. ENSURE ACTIVITY_LOGS TABLE EXISTS
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT,
    action TEXT NOT NULL,
    user_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_table ON activity_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
-- ============================================
-- 6. VERIFY TRIGGERS ARE ACTIVE
-- ============================================
-- List all active triggers
SELECT trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
-- ============================================
-- DONE! 
-- ============================================
-- Triggers created:
-- 1. trigger_user_welcome_email - New user signup
-- 2. trigger_new_lead_notification - New lead created
-- 3. synapse-sales-trigger - New business discovered
-- 4. synapse-chat-trigger - Chat message in BoardRoom
-- 5. synapse-subscription-trigger - Subscription changes
-- 6. log_*_activity - Activity logging on key tables