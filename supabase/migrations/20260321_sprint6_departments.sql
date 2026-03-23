-- ================================================================
-- SPRINT 6: Full Departments — Sales + Operations
--
-- New tables: agent_roster, department_reports
-- Establishes org chart: which agents belong to which department
-- Department heads run every 4 hours to coordinate their teams.
-- All additive — zero risk to existing data.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. AGENT ROSTER — the company org chart
--    Maps every agent to a department, role, and reporting line.
--    This is the source of truth for "who works where."
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,               -- 'executive', 'department_head', 'worker', 'specialist'
    department TEXT,                   -- 'executive', 'sales', 'operations', 'marketing', 'finance', NULL for cortex
    reports_to TEXT,                   -- agent_id of manager (NULL for CEO)
    avatar_emoji TEXT DEFAULT '🤖',
    description TEXT,
    schedule TEXT,                     -- 'every_15m', 'every_4h', 'daily', 'on_demand', 'event_driven'
    edge_function TEXT,               -- which Edge Function runs this agent
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'paused', 'disabled', 'maintenance'
    config JSONB DEFAULT '{}',        -- agent-specific settings
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roster_dept ON agent_roster(department) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_roster_reports ON agent_roster(reports_to);

ALTER TABLE agent_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_roster"
    ON agent_roster FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_roster"
    ON agent_roster FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 2. DEPARTMENT REPORTS — periodic team performance summaries
--    Written by department heads every 4 hours.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS department_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL,           -- 'sales', 'operations'
    head_agent_id TEXT NOT NULL,        -- the department head who wrote it
    report_period TEXT NOT NULL,        -- '2026-03-21T08:00' (4h block identifier)
    summary TEXT NOT NULL,
    team_performance JSONB DEFAULT '{}',  -- { agent_id: { actions: N, success_rate: %, issues: [] } }
    metrics JSONB DEFAULT '{}',
    micro_directives JSONB DEFAULT '[]',  -- short-term orders to team members
    escalations JSONB DEFAULT '[]',       -- issues pushed up to executives
    model_used TEXT,
    duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(department, report_period)
);

CREATE INDEX IF NOT EXISTS idx_dept_reports ON department_reports(department, created_at DESC);

ALTER TABLE department_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on department_reports"
    ON department_reports FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read department_reports"
    ON department_reports FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 3. SEED the org chart — full company hierarchy
-- ----------------------------------------------------------------
INSERT INTO agent_roster (agent_id, display_name, role, department, reports_to, avatar_emoji, description, schedule, edge_function) VALUES
    -- The Brain
    ('cortex', 'Cortex', 'brain', NULL, NULL, '🧠', 'Autonomous company brain — runs every 15 minutes', 'every_15m', 'cron-worker'),

    -- Executive Layer (Sprint 5)
    ('ceo', 'CEO', 'executive', 'executive', NULL, '👔', 'Chief Executive Officer — overall company direction', 'daily', 'executive-council'),
    ('cto', 'CTO', 'executive', 'executive', 'ceo', '🔧', 'Chief Technology Officer — system health & reliability', 'daily', 'executive-council'),
    ('cfo', 'CFO', 'executive', 'executive', 'ceo', '💰', 'Chief Financial Officer — revenue & cost optimization', 'daily', 'executive-council'),
    ('cmo', 'CMO', 'executive', 'executive', 'ceo', '📢', 'Chief Marketing Officer — acquisition & brand', 'daily', 'executive-council'),
    ('cro', 'CRO', 'executive', 'executive', 'ceo', '📈', 'Chief Revenue Officer — conversion & retention', 'daily', 'executive-council'),

    -- Sales Department
    ('sales-head', 'VP Sales', 'department_head', 'sales', 'cro', '🎯', 'Head of Sales — coordinates scout + outreach teams', 'every_4h', 'department-sync'),
    ('sales-scout', 'Sales Scout', 'worker', 'sales', 'sales-head', '🔍', 'Discovers new business leads via Google Maps', 'on_demand', 'sales-scout'),
    ('sales-outreach', 'Sales Outreach', 'worker', 'sales', 'sales-head', '📧', 'Sends personalized outreach to prospects', 'on_demand', 'sales-outreach'),

    -- Operations Department
    ('ops-head', 'VP Operations', 'department_head', 'operations', 'cto', '⚙️', 'Head of Operations — coordinates support + retention + payments', 'every_4h', 'department-sync'),
    ('retention-agent', 'Retention Agent', 'worker', 'operations', 'ops-head', '🛡️', 'Prevents churn — trial reminders, stale leads, win-back', 'on_demand', 'retention-agent'),
    ('payment-recovery', 'Payment Recovery', 'worker', 'operations', 'ops-head', '💳', 'Handles failed payments, retries, dunning', 'on_demand', 'payment-recovery'),
    ('support-router', 'Support Router', 'worker', 'operations', 'ops-head', '🎧', 'Routes and auto-resolves support tickets', 'event_driven', 'support-router')
ON CONFLICT (agent_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    reports_to = EXCLUDED.reports_to,
    avatar_emoji = EXCLUDED.avatar_emoji,
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    edge_function = EXCLUDED.edge_function,
    updated_at = now();

-- ----------------------------------------------------------------
-- 4. SEED department head capabilities
-- ----------------------------------------------------------------
INSERT INTO agent_capabilities (agent_id, capability, target, permission, constraints, tier) VALUES
    -- Sales Head: can call sales agents, write reports/directives
    ('sales-head', 'claude_api', 'claude-haiku', 'allow', '{"max_per_day": 6, "max_tokens": 2048}', 3),
    ('sales-head', 'call_edge_function', 'sales-scout', 'allow', '{"max_per_day": 10}', 3),
    ('sales-head', 'call_edge_function', 'sales-outreach', 'allow', '{"max_per_day": 10}', 3),
    ('sales-head', 'db_write', 'department_reports', 'allow', '{}', 2),
    ('sales-head', 'db_write', 'agent_directives', 'allow', '{}', 2),
    ('sales-head', 'db_write', 'signals', 'allow', '{}', 2),
    ('sales-head', 'db_write', 'strategy_store', 'allow', '{}', 2),

    -- Ops Head: can call ops agents, write reports/directives
    ('ops-head', 'claude_api', 'claude-haiku', 'allow', '{"max_per_day": 6, "max_tokens": 2048}', 3),
    ('ops-head', 'call_edge_function', 'retention-agent', 'allow', '{"max_per_day": 15}', 3),
    ('ops-head', 'call_edge_function', 'payment-recovery', 'allow', '{"max_per_day": 15}', 3),
    ('ops-head', 'call_edge_function', 'support-router', 'allow', '{"max_per_day": 15}', 3),
    ('ops-head', 'db_write', 'department_reports', 'allow', '{}', 2),
    ('ops-head', 'db_write', 'agent_directives', 'allow', '{}', 2),
    ('ops-head', 'db_write', 'signals', 'allow', '{}', 2),
    ('ops-head', 'db_write', 'strategy_store', 'allow', '{}', 2)
ON CONFLICT (agent_id, capability, target) DO NOTHING;

-- ----------------------------------------------------------------
-- 5. RPC: Get department context for a department head
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_department_context(p_department TEXT, p_head_agent_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    team_members JSONB;
    team_decisions JSONB;
    active_directives JSONB;
    dept_signals JSONB;
    last_report JSONB;
BEGIN
    -- Team members in this department
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agent_id', agent_id,
        'display_name', display_name,
        'role', role,
        'status', status,
        'schedule', schedule
    )), '[]'::jsonb)
    INTO team_members
    FROM agent_roster
    WHERE department = p_department
      AND role = 'worker'
      AND status = 'active';

    -- Team decisions (last 4 hours)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agent_id', agent_id,
        'type', decision_type,
        'success', success,
        'result', result,
        'created_at', created_at
    )), '[]'::jsonb)
    INTO team_decisions
    FROM (
        SELECT d.agent_id, d.decision_type, d.success, d.result, d.created_at
        FROM agent_decisions d
        JOIN agent_roster r ON r.agent_id = d.agent_id
        WHERE r.department = p_department
          AND r.role = 'worker'
          AND d.created_at > now() - interval '4 hours'
        ORDER BY d.created_at DESC
        LIMIT 30
    ) sub;

    -- Active directives targeting this department or its agents
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'issued_by', issued_by,
        'target', target_agent,
        'type', directive_type,
        'title', title,
        'description', description,
        'priority', priority
    )), '[]'::jsonb)
    INTO active_directives
    FROM agent_directives
    WHERE status = 'active'
      AND (target_agent = p_head_agent_id
           OR target_agent = '*'
           OR target_agent IN (
               SELECT agent_id FROM agent_roster
               WHERE department = p_department AND role = 'worker'
           ))
      AND (expires_at IS NULL OR expires_at > now());

    -- Recent signals from team
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'event_type', event_type,
        'source', source,
        'data', data,
        'created_at', created_at
    )), '[]'::jsonb)
    INTO dept_signals
    FROM (
        SELECT event_type, source, data, created_at
        FROM signals
        WHERE source IN (
            SELECT agent_id FROM agent_roster
            WHERE department = p_department AND role = 'worker'
        )
        AND created_at > now() - interval '4 hours'
        ORDER BY created_at DESC
        LIMIT 20
    ) sub;

    -- Last department report
    SELECT COALESCE(jsonb_build_object(
        'summary', summary,
        'metrics', metrics,
        'team_performance', team_performance,
        'created_at', created_at
    ), '{}'::jsonb)
    INTO last_report
    FROM department_reports
    WHERE department = p_department
    ORDER BY created_at DESC
    LIMIT 1;

    result := jsonb_build_object(
        'department', p_department,
        'head_agent_id', p_head_agent_id,
        'context_time', now(),
        'team_members', team_members,
        'team_decisions', team_decisions,
        'active_directives', active_directives,
        'recent_signals', dept_signals,
        'last_report', last_report
    );

    RETURN result;
END;
$$;

-- ----------------------------------------------------------------
-- 6. RPC: Get full org chart (for admin UI)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_org_chart()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agent_id', agent_id,
        'display_name', display_name,
        'role', role,
        'department', department,
        'reports_to', reports_to,
        'avatar_emoji', avatar_emoji,
        'description', description,
        'schedule', schedule,
        'edge_function', edge_function,
        'status', status
    ) ORDER BY
        CASE role
            WHEN 'brain' THEN 0
            WHEN 'executive' THEN 1
            WHEN 'department_head' THEN 2
            WHEN 'worker' THEN 3
            WHEN 'specialist' THEN 4
        END,
        department NULLS FIRST,
        display_name
    ), '[]'::jsonb)
    INTO result
    FROM agent_roster
    WHERE status != 'disabled';

    RETURN result;
END;
$$;
