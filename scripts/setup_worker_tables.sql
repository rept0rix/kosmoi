-- Create company_knowledge table for OTA updates and general storage
CREATE TABLE IF NOT EXISTS public.company_knowledge (
    key text PRIMARY KEY,
    value jsonb,
    category text,
    updated_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.company_knowledge ENABLE ROW LEVEL SECURITY;
-- Allow logic to read/write (Service Role bypasses this, but good practice)
CREATE POLICY "Allow All Access for detailed analysis" ON public.company_knowledge FOR ALL USING (true) WITH CHECK (true);
-- Grant access
GRANT ALL ON public.company_knowledge TO anon,
    authenticated,
    service_role;