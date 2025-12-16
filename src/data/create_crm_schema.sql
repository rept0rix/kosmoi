-- CRM Schema
-- 1. Pipelines (e.g., "Sales Pipeline", "Partnership Pipeline")
CREATE TABLE IF NOT EXISTS crm_pipelines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'sales',
    -- sales, recruiting, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Stages (e.g., "New", "Contacted", "Qualified", "Won")
CREATE TABLE IF NOT EXISTS crm_stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    -- For ordering in Kanban
    color TEXT DEFAULT '#cbd5e1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Leads / Contacts
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    -- Link if they are a registered user
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    stage_id UUID REFERENCES crm_stages(id),
    source TEXT,
    -- 'website', 'referral', 'manual'
    value DECIMAL(12, 2),
    notes TEXT,
    tags TEXT [],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Interactions (Log)
CREATE TABLE IF NOT EXISTS crm_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    -- 'call', 'email', 'meeting', 'note'
    summary TEXT,
    details TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);
-- Seed Default Pipeline & Stages
DO $$
DECLARE v_pipeline_id UUID;
BEGIN IF NOT EXISTS (
    SELECT 1
    FROM crm_pipelines
    WHERE name = 'General Sales'
) THEN
INSERT INTO crm_pipelines (name, type)
VALUES ('General Sales', 'sales')
RETURNING id INTO v_pipeline_id;
INSERT INTO crm_stages (pipeline_id, name, position, color)
VALUES (v_pipeline_id, 'New Lead', 1, '#3b82f6'),
    -- Blue
    (v_pipeline_id, 'Contacted', 2, '#eab308'),
    -- Yellow
    (v_pipeline_id, 'Proposal Sent', 3, '#a855f7'),
    -- Purple
    (v_pipeline_id, 'Negotiation', 4, '#f97316'),
    -- Orange
    (v_pipeline_id, 'Won', 5, '#22c55e'),
    -- Green
    (v_pipeline_id, 'Lost', 6, '#ef4444');
-- Red
END IF;
END $$;
-- Enable RLS
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
-- Policies (Simple Admin Access for now)
-- In a real app, this would be restricted to 'sales_agent' role or similar.
-- Here we allow all authenticated users (assuming app is internal/admin focused for this module)
CREATE POLICY "Enable all access for authenticated users" ON crm_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON crm_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON crm_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users" ON crm_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);