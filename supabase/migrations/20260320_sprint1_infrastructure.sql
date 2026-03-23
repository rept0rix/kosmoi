-- ================================================================
-- SPRINT 1: Infrastructure for Autonomous Company
--
-- New tables: agent_working_memory, agent_episodes, agent_capabilities, deploy_log
-- Extensions: agent_decisions gets outcome + verified columns
-- All additive — zero risk to existing data.
-- Rollback: DROP TABLE IF EXISTS for each new table.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. AGENT WORKING MEMORY — per-agent structured memory (Layer A)
--    Short-lived facts: today's tasks, pending items, context
--    Agents query this on boot instead of "remembering"
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_working_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agent_id, key)
);

CREATE INDEX IF NOT EXISTS idx_awm_agent ON agent_working_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_awm_agent_active ON agent_working_memory(agent_id, expires_at)
    WHERE expires_at IS NULL OR expires_at > now();

ALTER TABLE agent_working_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_working_memory"
    ON agent_working_memory FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_working_memory"
    ON agent_working_memory FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------
-- 2. AGENT EPISODES — compressed weekly summaries (Layer C)
--    Gives agents "institutional memory" without flooding context
--    Boot loads last 3 episodes (~500 tokens)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    week TEXT NOT NULL,  -- ISO week: '2026-W12'
    summary TEXT NOT NULL,
    key_decisions JSONB DEFAULT '[]',
    outcomes JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agent_id, week)
);

CREATE INDEX IF NOT EXISTS idx_episodes_agent ON agent_episodes(agent_id, week DESC);

ALTER TABLE agent_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_episodes"
    ON agent_episodes FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_episodes"
    ON agent_episodes FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------
-- 3. AGENT CAPABILITIES — permission matrix for agent-exec
--    Defines what each agent is ALLOWED to do
--    agent-exec checks this before executing any action
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    capability TEXT NOT NULL,        -- 'call_edge_function', 'db_write', 'external_api', 'claude_api'
    target TEXT NOT NULL,            -- 'sales-scout', 'service_providers', 'resend', etc.
    permission TEXT NOT NULL DEFAULT 'allow',  -- 'allow', 'deny', 'require_approval'
    constraints JSONB DEFAULT '{}',  -- { max_per_day: 10, allowed_actions: ['scout_location'] }
    tier INTEGER NOT NULL DEFAULT 1, -- Security tier: 1=read-only, 2=write-limited, 3=privileged, 4=external
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agent_id, capability, target)
);

CREATE INDEX IF NOT EXISTS idx_capabilities_agent ON agent_capabilities(agent_id) WHERE enabled = true;

ALTER TABLE agent_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on agent_capabilities"
    ON agent_capabilities FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read agent_capabilities"
    ON agent_capabilities FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------
-- 4. DEPLOY LOG — versioned deployment tracking
--    Every Edge Function deploy is logged here
--    Used for auto-rollback on circuit breaker
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deploy_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    version TEXT NOT NULL,
    deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deployed_by TEXT NOT NULL DEFAULT 'manual',  -- 'manual', 'github-actions', 'forge-agent'
    rollback_version TEXT,  -- previous version to roll back to
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'rolled_back', 'superseded'
    changelog TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deploy_function ON deploy_log(function_name, deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deploy_active ON deploy_log(function_name) WHERE status = 'active';

ALTER TABLE deploy_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on deploy_log"
    ON deploy_log FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read deploy_log"
    ON deploy_log FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------
-- 5. EXTEND agent_decisions — add outcome tracking + verification
--    Enables closed-loop: decision → action → outcome → learn
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_decisions' AND column_name = 'outcome'
    ) THEN
        ALTER TABLE agent_decisions ADD COLUMN outcome JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_decisions' AND column_name = 'verified'
    ) THEN
        ALTER TABLE agent_decisions ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_decisions' AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE agent_decisions ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_decisions' AND column_name = 'expected_outcome'
    ) THEN
        ALTER TABLE agent_decisions ADD COLUMN expected_outcome JSONB;
    END IF;
END $$;

-- ----------------------------------------------------------------
-- 6. SEED Wave 1 agent capabilities (Brain, Sales Scout, Retention)
-- ----------------------------------------------------------------
INSERT INTO agent_capabilities (agent_id, capability, target, permission, constraints, tier) VALUES
    -- Brain (cron-worker): can call all Wave 1 Edge Functions
    ('cron-worker', 'call_edge_function', 'retention-agent', 'allow', '{"max_per_day": 20}', 3),
    ('cron-worker', 'call_edge_function', 'payment-recovery', 'allow', '{"max_per_day": 20}', 3),
    ('cron-worker', 'call_edge_function', 'sales-scout', 'allow', '{"max_per_day": 10}', 3),
    ('cron-worker', 'call_edge_function', 'sales-outreach', 'allow', '{"max_per_day": 15}', 3),
    ('cron-worker', 'call_edge_function', 'admin-actions', 'allow', '{"max_per_day": 10}', 3),
    ('cron-worker', 'call_edge_function', 'support-router', 'allow', '{"max_per_day": 20}', 3),
    ('cron-worker', 'db_write', 'signals', 'allow', '{}', 3),
    ('cron-worker', 'db_write', 'agent_decisions', 'allow', '{}', 3),
    ('cron-worker', 'db_write', 'agent_working_memory', 'allow', '{}', 3),

    -- Sales Scout: can read providers, write signals, call Google Maps
    ('sales-scout', 'db_write', 'service_providers', 'allow', '{"max_per_day": 50}', 2),
    ('sales-scout', 'db_write', 'signals', 'allow', '{}', 2),
    ('sales-scout', 'external_api', 'google-maps', 'allow', '{"max_per_day": 100}', 4),
    ('sales-scout', 'external_api', 'resend', 'allow', '{"max_per_day": 20}', 4),

    -- Retention Agent: can read subscriptions, write emails, write signals
    ('retention-agent', 'db_write', 'signals', 'allow', '{}', 2),
    ('retention-agent', 'db_write', 'agent_decisions', 'allow', '{}', 2),
    ('retention-agent', 'db_write', 'email_logs', 'allow', '{}', 2),
    ('retention-agent', 'call_edge_function', 'send-email', 'allow', '{"max_per_day": 30}', 4),

    -- Payment Recovery: can manage subscriptions, call Stripe
    ('payment-recovery', 'db_write', 'signals', 'allow', '{}', 2),
    ('payment-recovery', 'db_write', 'agent_decisions', 'allow', '{}', 2),
    ('payment-recovery', 'db_write', 'subscriptions', 'allow', '{}', 2),
    ('payment-recovery', 'external_api', 'stripe', 'allow', '{"max_per_day": 20}', 4),

    -- Support Router: can manage tickets, write signals
    ('support-router', 'db_write', 'signals', 'allow', '{}', 2),
    ('support-router', 'db_write', 'agent_decisions', 'allow', '{}', 2),
    ('support-router', 'db_write', 'support_tickets', 'allow', '{}', 2),
    ('support-router', 'call_edge_function', 'send-email', 'allow', '{"max_per_day": 30}', 4),

    -- Sales Outreach: can write outreach data, call Resend
    ('sales-outreach', 'db_write', 'signals', 'allow', '{}', 2),
    ('sales-outreach', 'db_write', 'agent_decisions', 'allow', '{}', 2),
    ('sales-outreach', 'db_write', 'outreach_sequences', 'allow', '{}', 2),
    ('sales-outreach', 'external_api', 'resend', 'allow', '{"max_per_day": 50}', 4)
ON CONFLICT (agent_id, capability, target) DO NOTHING;

-- ----------------------------------------------------------------
-- 7. RPC: Upsert agent working memory (used by agents on every cycle)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION upsert_agent_memory(
    p_agent_id TEXT,
    p_key TEXT,
    p_value JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO agent_working_memory (agent_id, key, value, expires_at, updated_at)
    VALUES (p_agent_id, p_key, p_value, p_expires_at, now())
    ON CONFLICT (agent_id, key)
    DO UPDATE SET
        value = EXCLUDED.value,
        expires_at = EXCLUDED.expires_at,
        updated_at = now();
END;
$$;

-- ----------------------------------------------------------------
-- 8. RPC: Get agent boot context (everything an agent needs on startup)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_agent_boot_context(p_agent_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    working_mem JSONB;
    episodes JSONB;
    capabilities JSONB;
    goals JSONB;
BEGIN
    -- Working memory (active, non-expired)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'key', key, 'value', value, 'updated_at', updated_at
    )), '[]'::jsonb)
    INTO working_mem
    FROM agent_working_memory
    WHERE agent_id = p_agent_id
      AND (expires_at IS NULL OR expires_at > now());

    -- Last 3 episodes
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'week', week, 'summary', summary,
        'key_decisions', key_decisions, 'outcomes', outcomes
    )), '[]'::jsonb)
    INTO episodes
    FROM (
        SELECT week, summary, key_decisions, outcomes
        FROM agent_episodes
        WHERE agent_id = p_agent_id
        ORDER BY week DESC
        LIMIT 3
    ) sub;

    -- Capabilities
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'capability', capability, 'target', target,
        'permission', permission, 'constraints', constraints
    )), '[]'::jsonb)
    INTO capabilities
    FROM agent_capabilities
    WHERE agent_id = p_agent_id AND enabled = true;

    -- Active company goals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', title, 'metric_key', metric_key,
        'target_value', target_value, 'current_value', current_value,
        'priority', priority
    )), '[]'::jsonb)
    INTO goals
    FROM company_goals
    WHERE status = 'active'
    ORDER BY priority ASC;

    result := jsonb_build_object(
        'agent_id', p_agent_id,
        'boot_time', now(),
        'working_memory', working_mem,
        'episodes', episodes,
        'capabilities', capabilities,
        'company_goals', goals
    );

    RETURN result;
END;
$$;
