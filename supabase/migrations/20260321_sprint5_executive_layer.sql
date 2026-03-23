-- ================================================================
-- SPRINT 5: Executive Layer — C-Suite AI Agents
--
-- New tables: executive_reports, agent_directives
-- New RPC: get_executive_context()
-- Seeds capabilities for 5 executive agents
-- All additive — zero risk to existing data.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. EXECUTIVE REPORTS — daily strategic analysis from C-suite agents
--    Each executive writes a report with analysis, recommendations,
--    and KPIs relevant to their domain.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,         -- 'ceo', 'cto', 'cfo', 'cmo', 'cro'
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    report_type TEXT NOT NULL DEFAULT 'daily',  -- 'daily', 'weekly', 'incident'
    summary TEXT NOT NULL,
    analysis JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    kpis JSONB DEFAULT '{}',
    directives_issued INTEGER DEFAULT 0,
    model_used TEXT,                -- 'claude-sonnet-4-20250514', etc.
    tokens_used INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agent_id, report_date, report_type)
);

CREATE INDEX IF NOT EXISTS idx_exec_reports_agent ON executive_reports(agent_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_exec_reports_date ON executive_reports(report_date DESC);

ALTER TABLE executive_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on executive_reports"
    ON executive_reports FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read executive_reports"
    ON executive_reports FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------
-- 2. AGENT DIRECTIVES — orders from executives to operational agents
--    Executives issue directives that change how the Cortex and
--    operational agents behave. Directives have TTL and priority.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_directives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issued_by TEXT NOT NULL,         -- executive agent_id ('ceo', 'cto', etc.)
    target_agent TEXT NOT NULL,      -- 'cortex', 'sales-scout', 'retention-agent', '*' (all)
    directive_type TEXT NOT NULL,    -- 'priority_shift', 'strategy_change', 'budget_adjust', 'pause', 'focus'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',  -- type-specific params: { metric: 'mrr', target: 5000 }
    priority INTEGER NOT NULL DEFAULT 50,  -- 0-100
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
    expires_at TIMESTAMPTZ,         -- NULL = no expiry
    completed_at TIMESTAMPTZ,
    outcome JSONB,                  -- what happened after directive was executed
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_directives_target ON agent_directives(target_agent, status)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_directives_issuer ON agent_directives(issued_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_directives_active ON agent_directives(status, expires_at)
    WHERE status = 'active';

ALTER TABLE agent_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_directives"
    ON agent_directives FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_directives"
    ON agent_directives FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------
-- 3. SEED Executive agent capabilities
--    Executives can: read everything, write reports/directives/goals/strategies,
--    call Claude API for reasoning
-- ----------------------------------------------------------------
INSERT INTO agent_capabilities (agent_id, capability, target, permission, constraints, tier) VALUES
    -- CEO: Full strategic control
    ('ceo', 'claude_api', 'claude-sonnet', 'allow', '{"max_per_day": 5, "max_tokens": 4096}', 3),
    ('ceo', 'db_write', 'executive_reports', 'allow', '{}', 3),
    ('ceo', 'db_write', 'agent_directives', 'allow', '{}', 3),
    ('ceo', 'db_write', 'company_goals', 'allow', '{"max_per_day": 10}', 3),
    ('ceo', 'db_write', 'strategy_store', 'allow', '{}', 3),
    ('ceo', 'db_write', 'signals', 'allow', '{}', 2),

    -- CTO: System health + tech decisions
    ('cto', 'claude_api', 'claude-sonnet', 'allow', '{"max_per_day": 5, "max_tokens": 4096}', 3),
    ('cto', 'db_write', 'executive_reports', 'allow', '{}', 3),
    ('cto', 'db_write', 'agent_directives', 'allow', '{}', 3),
    ('cto', 'db_write', 'deploy_log', 'allow', '{}', 3),
    ('cto', 'db_write', 'signals', 'allow', '{}', 2),

    -- CFO: Financial control
    ('cfo', 'claude_api', 'claude-sonnet', 'allow', '{"max_per_day": 5, "max_tokens": 4096}', 3),
    ('cfo', 'db_write', 'executive_reports', 'allow', '{}', 3),
    ('cfo', 'db_write', 'agent_directives', 'allow', '{}', 3),
    ('cfo', 'db_write', 'company_goals', 'allow', '{"max_per_day": 5}', 3),
    ('cfo', 'db_write', 'signals', 'allow', '{}', 2),

    -- CMO: Marketing strategy
    ('cmo', 'claude_api', 'claude-sonnet', 'allow', '{"max_per_day": 5, "max_tokens": 4096}', 3),
    ('cmo', 'db_write', 'executive_reports', 'allow', '{}', 3),
    ('cmo', 'db_write', 'agent_directives', 'allow', '{}', 3),
    ('cmo', 'db_write', 'strategy_store', 'allow', '{}', 3),
    ('cmo', 'db_write', 'signals', 'allow', '{}', 2),

    -- CRO: Revenue optimization
    ('cro', 'claude_api', 'claude-sonnet', 'allow', '{"max_per_day": 5, "max_tokens": 4096}', 3),
    ('cro', 'db_write', 'executive_reports', 'allow', '{}', 3),
    ('cro', 'db_write', 'agent_directives', 'allow', '{}', 3),
    ('cro', 'db_write', 'company_goals', 'allow', '{"max_per_day": 5}', 3),
    ('cro', 'db_write', 'strategy_store', 'allow', '{}', 3),
    ('cro', 'db_write', 'signals', 'allow', '{}', 2)
ON CONFLICT (agent_id, capability, target) DO NOTHING;

-- ----------------------------------------------------------------
-- 4. RPC: Get executive context — everything an exec needs to reason
--    Loads: platform snapshot, recent agent decisions, active directives,
--    company goals, recent signals, financial data
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_executive_context(p_agent_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    recent_decisions JSONB;
    active_directives JSONB;
    goals JSONB;
    recent_reports JSONB;
    agent_performance JSONB;
    signal_summary JSONB;
BEGIN
    -- Last 24h agent decisions (how are operational agents performing?)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agent_id', agent_id,
        'type', decision_type,
        'success', success,
        'created_at', created_at
    )), '[]'::jsonb)
    INTO recent_decisions
    FROM (
        SELECT agent_id, decision_type, success, created_at
        FROM agent_decisions
        WHERE created_at > now() - interval '24 hours'
        ORDER BY created_at DESC
        LIMIT 50
    ) sub;

    -- Active directives (what orders are currently in effect?)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'issued_by', issued_by,
        'target', target_agent,
        'type', directive_type,
        'title', title,
        'priority', priority,
        'created_at', created_at,
        'expires_at', expires_at
    )), '[]'::jsonb)
    INTO active_directives
    FROM agent_directives
    WHERE status = 'active'
      AND (expires_at IS NULL OR expires_at > now());

    -- Company goals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', title,
        'metric_key', metric_key,
        'target_value', target_value,
        'current_value', current_value,
        'priority', priority,
        'status', status
    )), '[]'::jsonb)
    INTO goals
    FROM company_goals
    WHERE status IN ('active', 'at_risk')
    ORDER BY priority ASC;

    -- Last 3 reports from this executive (continuity)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'date', report_date,
        'summary', summary,
        'recommendations', recommendations,
        'kpis', kpis
    )), '[]'::jsonb)
    INTO recent_reports
    FROM (
        SELECT report_date, summary, recommendations, kpis
        FROM executive_reports
        WHERE agent_id = p_agent_id
        ORDER BY report_date DESC
        LIMIT 3
    ) sub;

    -- Agent performance summary (last 7 days)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agent_id', agent_id,
        'total', total,
        'succeeded', succeeded,
        'success_rate', CASE WHEN total > 0 THEN ROUND(succeeded::numeric / total * 100) ELSE 0 END
    )), '[]'::jsonb)
    INTO agent_performance
    FROM (
        SELECT
            agent_id,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE success = true) as succeeded
        FROM agent_decisions
        WHERE created_at > now() - interval '7 days'
        GROUP BY agent_id
        ORDER BY COUNT(*) DESC
    ) sub;

    -- Signal summary (last 24h by type)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'event_type', event_type,
        'count', cnt
    )), '[]'::jsonb)
    INTO signal_summary
    FROM (
        SELECT event_type, COUNT(*) as cnt
        FROM signals
        WHERE created_at > now() - interval '24 hours'
        GROUP BY event_type
        ORDER BY COUNT(*) DESC
        LIMIT 20
    ) sub;

    result := jsonb_build_object(
        'agent_id', p_agent_id,
        'context_time', now(),
        'recent_decisions', recent_decisions,
        'active_directives', active_directives,
        'company_goals', goals,
        'recent_reports', recent_reports,
        'agent_performance', agent_performance,
        'signal_summary', signal_summary
    );

    RETURN result;
END;
$$;

-- ----------------------------------------------------------------
-- 5. RPC: Get active directives for a target agent
--    Used by Cortex to read what executives want it to do
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_directives(p_target_agent TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Expire old directives first
    UPDATE agent_directives
    SET status = 'expired', updated_at = now()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < now();

    -- Get active directives for this agent or all agents
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'issued_by', issued_by,
        'type', directive_type,
        'title', title,
        'description', description,
        'parameters', parameters,
        'priority', priority,
        'created_at', created_at,
        'expires_at', expires_at
    ) ORDER BY priority DESC), '[]'::jsonb)
    INTO result
    FROM agent_directives
    WHERE status = 'active'
      AND (target_agent = p_target_agent OR target_agent = '*')
      AND (expires_at IS NULL OR expires_at > now());

    RETURN result;
END;
$$;
