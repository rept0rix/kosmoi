-- ROBUST Fix for Service Providers Schema
-- Safely adds columns, triggers, and enables realtime without erroring if they exist.
-- 1. Safely add updated_at column
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
-- 2. Create specific trigger function (avoid name collision)
CREATE OR REPLACE FUNCTION update_sp_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
-- 3. Update Trigger
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON public.service_providers;
CREATE TRIGGER update_service_providers_updated_at BEFORE
UPDATE ON public.service_providers FOR EACH ROW EXECUTE PROCEDURE update_sp_timestamp();
-- 4. Safely add to publication (avoids "already member" error)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'service_providers'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE public.service_providers;
END IF;
END $$;