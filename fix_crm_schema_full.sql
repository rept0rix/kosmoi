-- Fix CRM Tables for RxDB Replication
-- Ensures updated_at column and triggers exist for crm_stages and crm_leads
-- 1. Helper Function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
-- 2. Setup crm_stages
ALTER TABLE public.crm_stages
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
DROP TRIGGER IF EXISTS update_crm_stages_updated_at ON public.crm_stages;
CREATE TRIGGER update_crm_stages_updated_at BEFORE
UPDATE ON public.crm_stages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- 3. Setup crm_leads
-- (Column checked as existing, but ensuring trigger safety)
ALTER TABLE public.crm_leads
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER update_crm_leads_updated_at BEFORE
UPDATE ON public.crm_leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- 4. Enable Realtime for both
ALTER PUBLICATION supabase_realtime
ADD TABLE public.crm_stages;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.crm_leads;