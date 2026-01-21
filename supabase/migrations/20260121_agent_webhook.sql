-- Enable the pg_net extension to send HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Create a function that invokes the Edge Function
CREATE OR REPLACE FUNCTION invoke_agent_worker() RETURNS TRIGGER AS $$ BEGIN -- This version is deprecated in favor of invoke_agent_worker_public below
    IF NEW.agent_id = 'HUMAN_USER' THEN PERFORM net.http_post(
        url := 'https://gzjzeywhqbwppfxqkptf.supabase.co/functions/v1/agent-worker',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object('record', row_to_json(NEW))
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION invoke_agent_worker_public() RETURNS TRIGGER AS $$
DECLARE project_url text := 'https://gzjzeywhqbwppfxqkptf.supabase.co';
BEGIN IF NEW.agent_id = 'HUMAN_USER' THEN PERFORM net.http_post(
    url := project_url || '/functions/v1/agent-worker',
    headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer sb_publishable_dP_8q9Q25Dg5qQXxIhDS0A_IPKNOOvO'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Re-applying trigger to use the public function
DROP TRIGGER IF EXISTS on_new_message_trigger ON board_messages;
CREATE TRIGGER on_new_message_trigger
AFTER
INSERT ON board_messages FOR EACH ROW EXECUTE FUNCTION invoke_agent_worker_public();