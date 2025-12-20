-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Pipelines
CREATE TABLE IF NOT EXISTS crm_pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Stages
CREATE TABLE IF NOT EXISTS crm_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Leads
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID REFERENCES crm_stages(id) ON DELETE
    SET NULL,
        first_name TEXT,
        last_name TEXT,
        company TEXT,
        email TEXT,
        phone TEXT,
        value DECIMAL(12, 2) DEFAULT 0,
        status TEXT DEFAULT 'new',
        -- new, open, won, lost
        source TEXT DEFAULT 'manual',
        priority TEXT DEFAULT 'medium',
        assigned_to UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Interactions
CREATE TABLE IF NOT EXISTS crm_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    -- email, call, meeting, note
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS Policies
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users (admins/agents) full access for now
CREATE POLICY "Allow full access to pipelines" ON crm_pipelines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to stages" ON crm_stages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to leads" ON crm_leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to interactions" ON crm_interactions FOR ALL USING (auth.role() = 'authenticated');
-- Insert Default Data if empty
DO $$
DECLARE default_pipeline_id UUID;
BEGIN IF NOT EXISTS (
    SELECT 1
    FROM crm_pipelines
) THEN
INSERT INTO crm_pipelines (name, is_default)
VALUES ('Default Sales Pipeline', true)
RETURNING id INTO default_pipeline_id;
INSERT INTO crm_stages (pipeline_id, name, position, color)
VALUES (default_pipeline_id, 'New Lead', 1, '#3b82f6'),
    -- Blue
    (default_pipeline_id, 'Contacted', 2, '#eab308'),
    -- Yellow
    (default_pipeline_id, 'Proposal', 3, '#a855f7'),
    -- Purple
    (default_pipeline_id, 'Negotiation', 4, '#f97316'),
    -- Orange
    (default_pipeline_id, 'Closed Won', 5, '#22c55e');
-- Green
END IF;
END $$;