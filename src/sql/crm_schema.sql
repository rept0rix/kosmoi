-- CRM Schema Definitions
-- 1. Pipelines
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false
);
-- 2. Stages
CREATE TABLE IF NOT EXISTS public.crm_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pipeline_id UUID REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#94a3b8',
    -- Slate 400 default
    metadata JSONB DEFAULT '{}'::jsonb
);
-- 3. Leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    stage_id UUID REFERENCES public.crm_stages(id) ON DELETE
    SET NULL,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        email TEXT,
        phone TEXT,
        source TEXT DEFAULT 'manual',
        -- 'manual', 'website', 'referral', 'agent'
        status TEXT DEFAULT 'new',
        -- 'new', 'open', 'won', 'lost'
        priority TEXT DEFAULT 'medium',
        -- 'low', 'medium', 'high'
        value NUMERIC(10, 2) DEFAULT 0,
        assigned_to UUID REFERENCES auth.users(id),
        metadata JSONB DEFAULT '{}'::jsonb,
        tags TEXT []
);
-- 4. Interactions (for Timeline)
CREATE TABLE IF NOT EXISTS public.crm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    -- 'note', 'email', 'call', 'meeting', 'status_change', 'stage_change'
    content TEXT,
    performed_by UUID REFERENCES auth.users(id),
    -- Or NULL if system/agent
    metadata JSONB DEFAULT '{}'::jsonb
);
-- RLS Policies (Simple: Authenticated users can do everything for now)
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.crm_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.crm_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.crm_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.crm_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Seed Data (Idempotent-ish)
DO $$
DECLARE pid UUID;
sid1 UUID;
sid2 UUID;
sid3 UUID;
sid4 UUID;
BEGIN -- Create Default Pipeline if not exists
IF NOT EXISTS (
    SELECT 1
    FROM public.crm_pipelines
    WHERE name = 'General Sales'
) THEN
INSERT INTO public.crm_pipelines (name, description, is_default)
VALUES ('General Sales', 'Standard sales process', true)
RETURNING id INTO pid;
-- Create Default Stages
INSERT INTO public.crm_stages (pipeline_id, name, position, color)
VALUES (pid, 'New / Raw', 0, '#64748b'),
    -- Slate 500
    (pid, 'Qualified', 1, '#3b82f6'),
    -- Blue 500
    (pid, 'Contacted', 2, '#f97316'),
    -- Orange 500
    (pid, 'Negotiation', 3, '#a855f7'),
    -- Purple 500
    (pid, 'Won', 4, '#22c55e'),
    -- Green 500
    (pid, 'Lost', 5, '#ef4444');
-- Red 500
END IF;
END $$;