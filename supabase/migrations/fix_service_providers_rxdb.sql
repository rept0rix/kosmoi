-- Fix service_providers schema for RxDB replication
-- Adds updated_at column and auto-update trigger
-- 1. Add updated_at column if it doesn't exist
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
-- 2. Create or Replace the update_updated_at_column function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
-- 3. Create Trigger for service_providers
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON public.service_providers;
CREATE TRIGGER update_service_providers_updated_at BEFORE
UPDATE ON public.service_providers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime
ADD TABLE public.service_providers;