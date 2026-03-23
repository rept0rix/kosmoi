-- ================================================================
-- SPRINT 9: Self-Evolution Layer
--
-- New tables: agent_reviews, evolution_proposals, compliance_log
-- New agents: hr-agent, legal-agent, the-forge
--
-- PHILOSOPHY: Agents can PROPOSE changes to the company,
-- but destructive changes require God (admin) approval.
-- Read-only analysis runs autonomously.
-- All additive — zero risk to existing data.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. AGENT REVIEWS — HR's periodic agent performance evaluations
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,               -- agent being reviewed
    reviewer TEXT NOT NULL DEFAULT 'hr-agent',
    period TEXT NOT NULL,                  -- '2026-03-22', 'week-12', etc.

    -- Performance metrics
    decisions_count INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2),            -- 0-100
    avg_latency_ms INTEGER,
    cost_usd NUMERIC(10,6) DEFAULT 0,

    -- HR assessment
    grade TEXT NOT NULL,                   -- 'A', 'B', 'C', 'D', 'F'
    strengths TEXT[],
    weaknesses TEXT[],
    recommendation TEXT NOT NULL,          -- 'keep', 'retrain', 'optimize', 'disable', 'promote'
    reasoning TEXT,

    -- Action taken
    action_status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'executed'
    approved_by TEXT,                      -- 'admin' or NULL

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_agent ON agent_reviews(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_grade ON agent_reviews(grade);

ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on agent_reviews"
    ON agent_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read agent_reviews"
    ON agent_reviews FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 2. EVOLUTION PROPOSALS — The Forge's proposals for new agents
--    or modifications to existing ones. Requires admin approval.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evolution_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_type TEXT NOT NULL,           -- 'create_agent', 'modify_agent', 'disable_agent', 'new_capability', 'new_workflow'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_by TEXT NOT NULL DEFAULT 'the-forge',

    -- For create_agent proposals
    agent_spec JSONB,                      -- { agent_id, display_name, role, department, capabilities, schedule, system_prompt }

    -- For modify_agent proposals
    target_agent_id TEXT,
    modifications JSONB,                   -- what to change

    -- Justification
    reasoning TEXT NOT NULL,
    expected_impact TEXT,                  -- 'high', 'medium', 'low'
    estimated_daily_cost NUMERIC(10,4),
    risk_level TEXT DEFAULT 'low',         -- 'low', 'medium', 'high', 'critical'

    -- Approval workflow
    status TEXT NOT NULL DEFAULT 'proposed', -- 'proposed', 'approved', 'rejected', 'implemented', 'expired'
    reviewed_by TEXT,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    implemented_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON evolution_proposals(status) WHERE status = 'proposed';
CREATE INDEX IF NOT EXISTS idx_proposals_type ON evolution_proposals(proposal_type);

ALTER TABLE evolution_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on evolution_proposals"
    ON evolution_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read evolution_proposals"
    ON evolution_proposals FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 3. COMPLIANCE LOG — Legal agent's audit trail
--    Every action that was checked, and whether it passed.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,               -- agent whose action was checked
    action_type TEXT NOT NULL,            -- what they tried to do
    rule_checked TEXT NOT NULL,           -- which rule was evaluated
    verdict TEXT NOT NULL,                -- 'pass', 'warn', 'block'
    reason TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_agent ON compliance_log(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_verdict ON compliance_log(verdict) WHERE verdict IN ('warn', 'block');

ALTER TABLE compliance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on compliance_log"
    ON compliance_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read compliance_log"
    ON compliance_log FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 4. Add Self-Evolution agents to the roster
-- ----------------------------------------------------------------
INSERT INTO agent_roster (agent_id, display_name, role, department, reports_to, avatar_emoji, description, schedule, edge_function, status)
VALUES
    ('hr-agent', 'HR Agent', 'specialist', 'executive', 'ceo', '👥',
     'Evaluates agent performance, recommends training/optimization/disabling. Reviews all agents weekly.',
     'daily', 'hr-review', 'active'),
    ('legal-agent', 'Legal Agent', 'specialist', 'executive', 'ceo', '⚖️',
     'Compliance guardian. Audits agent actions for policy violations, cost overruns, and risky behavior.',
     'every_4h', 'compliance-check', 'active'),
    ('the-forge', 'The Forge', 'specialist', 'executive', 'cto', '🔥',
     'Agent factory. Analyzes company gaps and proposes new agents or capabilities. Cannot create without admin approval.',
     'daily', 'agent-forge', 'active')
ON CONFLICT (agent_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    reports_to = EXCLUDED.reports_to,
    avatar_emoji = EXCLUDED.avatar_emoji,
    description = EXCLUDED.description;

-- ----------------------------------------------------------------
-- 5. Capabilities for self-evolution agents
-- ----------------------------------------------------------------
INSERT INTO agent_capabilities (agent_id, capability, constraints) VALUES
    ('hr-agent', 'claude_api', '{"max_per_day": 4, "models": ["claude-haiku-4-5-20251001"], "max_tokens": 2048}'),
    ('hr-agent', 'db_write', '{"tables": ["agent_reviews", "signals"], "max_per_day": 50}'),
    ('legal-agent', 'claude_api', '{"max_per_day": 6, "models": ["claude-haiku-4-5-20251001"], "max_tokens": 1024}'),
    ('legal-agent', 'db_write', '{"tables": ["compliance_log", "signals"], "max_per_day": 100}'),
    ('the-forge', 'claude_api', '{"max_per_day": 2, "models": ["claude-sonnet-4-20250514"], "max_tokens": 4096}'),
    ('the-forge', 'db_write', '{"tables": ["evolution_proposals", "signals"], "max_per_day": 5}')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 6. RPC: Get evolution dashboard data
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_evolution_dashboard()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'reviews', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', r.id,
                'agent_id', r.agent_id,
                'grade', r.grade,
                'success_rate', r.success_rate,
                'recommendation', r.recommendation,
                'reasoning', r.reasoning,
                'action_status', r.action_status,
                'created_at', r.created_at
            ) ORDER BY r.created_at DESC), '[]'::JSONB)
            FROM agent_reviews r
            WHERE r.created_at >= now() - INTERVAL '30 days'
        ),
        'proposals', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', p.id,
                'proposal_type', p.proposal_type,
                'title', p.title,
                'description', p.description,
                'proposed_by', p.proposed_by,
                'risk_level', p.risk_level,
                'expected_impact', p.expected_impact,
                'estimated_daily_cost', p.estimated_daily_cost,
                'status', p.status,
                'reasoning', p.reasoning,
                'agent_spec', p.agent_spec,
                'created_at', p.created_at,
                'expires_at', p.expires_at
            ) ORDER BY p.created_at DESC), '[]'::JSONB)
            FROM evolution_proposals p
            WHERE p.status IN ('proposed', 'approved')
               OR p.created_at >= now() - INTERVAL '14 days'
        ),
        'compliance', (
            SELECT jsonb_build_object(
                'total_checks', COUNT(*),
                'passed', COUNT(*) FILTER (WHERE verdict = 'pass'),
                'warnings', COUNT(*) FILTER (WHERE verdict = 'warn'),
                'blocked', COUNT(*) FILTER (WHERE verdict = 'block'),
                'recent_blocks', (
                    SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'agent_id', c2.agent_id,
                        'action_type', c2.action_type,
                        'reason', c2.reason,
                        'created_at', c2.created_at
                    ) ORDER BY c2.created_at DESC), '[]'::JSONB)
                    FROM compliance_log c2
                    WHERE c2.verdict = 'block'
                    AND c2.created_at >= now() - INTERVAL '7 days'
                )
            )
            FROM compliance_log
            WHERE created_at >= now() - INTERVAL '7 days'
        ),
        'grade_distribution', (
            SELECT COALESCE(jsonb_object_agg(grade, cnt), '{}'::JSONB)
            FROM (
                SELECT grade, COUNT(*) as cnt
                FROM agent_reviews
                WHERE created_at >= now() - INTERVAL '30 days'
                GROUP BY grade
            ) sub
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- 7. RPC: Approve/reject an evolution proposal (admin action)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION review_proposal(
    p_proposal_id UUID,
    p_verdict TEXT,          -- 'approved' or 'rejected'
    p_reviewer TEXT DEFAULT 'admin',
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE evolution_proposals SET
        status = p_verdict,
        reviewed_by = p_reviewer,
        review_notes = p_notes,
        reviewed_at = now()
    WHERE id = p_proposal_id
    AND status = 'proposed';

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Write signal
    PERFORM write_signal(
        'evolution.proposal_' || p_verdict,
        p_proposal_id::TEXT,
        jsonb_build_object('reviewer', p_reviewer, 'notes', p_notes)
    );

    RETURN true;
END;
$$;
