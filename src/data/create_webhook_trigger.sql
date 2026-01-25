-- Create Trigger to call Edge Function via pg_net
CREATE OR REPLACE FUNCTION trigger_agent_worker() RETURNS TRIGGER AS $$
DECLARE payload jsonb;
request_id bigint;
BEGIN -- Construct payload matching the format agent-worker expects
payload = jsonb_build_object(
    'type',
    TG_OP,
    'table',
    TG_TABLE_NAME,
    'schema',
    TG_TABLE_SCHEMA,
    'record',
    row_to_json(NEW)
);
-- Perform HTTP Request
-- Note: Replace ANON_KEY with the actual key in the Execute step
-- We use the internal network address if possible, or public URL.
-- URL: https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/agent-worker
SELECT net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/agent-worker',
        headers := jsonb_build_object(
            'Content-Type',
            'application/json',
            'Authorization',
            'Bearer ' || current_setting('app.settings.anon_key', true) -- If app.settings.anon_key isn't set (it usually isn't in SQL editor context), we must hardcode or pass it.
            -- For this script, we will inject it.
        ),
        body := payload
    ) INTO request_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger
DROP TRIGGER IF EXISTS "synapse-sales-trigger" ON "service_providers";
CREATE TRIGGER "synapse-sales-trigger"
AFTER
INSERT ON "service_providers" FOR EACH ROW EXECUTE FUNCTION trigger_agent_worker();