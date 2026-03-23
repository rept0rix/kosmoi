-- ================================================================
-- SPRINT 8: Enhanced God View
--
-- New tables: ai_cost_log
-- New RPCs: get_ai_costs, get_agent_health, get_action_timeline
-- Tracks every Claude API call's cost for full transparency.
-- "God" sees everything — cost, health, timeline, signals.
-- All additive — zero risk to existing data.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. AI COST LOG — tracks every AI API call and its cost
--    Written by Edge Functions that call Claude/Perplexity/etc.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_cost_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,               -- which agent made the call
    edge_function TEXT,                    -- which Edge Function
    model TEXT NOT NULL,                   -- 'claude-haiku-4-5-20251001', etc.
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,  -- actual cost in USD
    purpose TEXT,                          -- 'cortex_reasoning', 'content_generation', 'executive_council', etc.
    latency_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_log_agent ON ai_cost_log(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_log_date ON ai_cost_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_log_model ON ai_cost_log(model);

ALTER TABLE ai_cost_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on ai_cost_log"
    ON ai_cost_log FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read ai_cost_log"
    ON ai_cost_log FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 2. RPC: Log an AI cost entry (called by Edge Functions)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_ai_cost(
    p_agent_id TEXT,
    p_edge_function TEXT,
    p_model TEXT,
    p_input_tokens INTEGER,
    p_output_tokens INTEGER,
    p_cost_usd NUMERIC,
    p_purpose TEXT DEFAULT NULL,
    p_latency_ms INTEGER DEFAULT 0,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO ai_cost_log (
        agent_id, edge_function, model, input_tokens, output_tokens,
        cost_usd, purpose, latency_ms, success, error_message
    )
    VALUES (
        p_agent_id, p_edge_function, p_model, p_input_tokens, p_output_tokens,
        p_cost_usd, p_purpose, p_latency_ms, p_success, p_error_message
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------
-- 3. RPC: Get AI cost summary (for God View dashboard)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_ai_costs(p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_cost_usd', COALESCE(SUM(cost_usd), 0),
        'total_tokens', COALESCE(SUM(total_tokens), 0),
        'total_calls', COUNT(*),
        'successful_calls', COUNT(*) FILTER (WHERE success = true),
        'failed_calls', COUNT(*) FILTER (WHERE success = false),
        'avg_latency_ms', COALESCE(AVG(latency_ms) FILTER (WHERE success = true), 0)::INTEGER,
        'today_cost_usd', COALESCE(SUM(cost_usd) FILTER (WHERE created_at >= CURRENT_DATE), 0),
        'today_tokens', COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= CURRENT_DATE), 0),
        'today_calls', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'by_agent', (
            SELECT COALESCE(jsonb_object_agg(agent_id, agent_data), '{}'::JSONB)
            FROM (
                SELECT agent_id, jsonb_build_object(
                    'cost_usd', SUM(cost_usd),
                    'tokens', SUM(total_tokens),
                    'calls', COUNT(*),
                    'avg_latency_ms', AVG(latency_ms)::INTEGER
                ) as agent_data
                FROM ai_cost_log
                WHERE created_at >= now() - make_interval(days => p_days)
                GROUP BY agent_id
            ) sub
        ),
        'by_model', (
            SELECT COALESCE(jsonb_object_agg(model, model_data), '{}'::JSONB)
            FROM (
                SELECT model, jsonb_build_object(
                    'cost_usd', SUM(cost_usd),
                    'tokens', SUM(total_tokens),
                    'calls', COUNT(*)
                ) as model_data
                FROM ai_cost_log
                WHERE created_at >= now() - make_interval(days => p_days)
                GROUP BY model
            ) sub
        ),
        'daily_trend', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'date', day::TEXT,
                'cost_usd', daily_cost,
                'calls', daily_calls
            ) ORDER BY day), '[]'::JSONB)
            FROM (
                SELECT date_trunc('day', created_at)::DATE as day,
                       SUM(cost_usd) as daily_cost,
                       COUNT(*) as daily_calls
                FROM ai_cost_log
                WHERE created_at >= now() - make_interval(days => p_days)
                GROUP BY day
            ) sub
        )
    ) INTO v_result
    FROM ai_cost_log
    WHERE created_at >= now() - make_interval(days => p_days);

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- 4. RPC: Get agent health overview
--    Shows all agents, their last activity, and status.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_agent_health()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agent_id', r.agent_id,
        'display_name', r.display_name,
        'role', r.role,
        'department', r.department,
        'avatar_emoji', r.avatar_emoji,
        'status', r.status,
        'schedule', r.schedule,
        'last_signal', (
            SELECT created_at FROM signals
            WHERE data->>'agent_id' = r.agent_id
               OR event_type LIKE '%' || r.agent_id || '%'
            ORDER BY created_at DESC LIMIT 1
        ),
        'last_decision', (
            SELECT created_at FROM agent_decisions
            WHERE agent_id = r.agent_id
            ORDER BY created_at DESC LIMIT 1
        ),
        'decisions_today', (
            SELECT COUNT(*) FROM agent_decisions
            WHERE agent_id = r.agent_id
            AND created_at >= CURRENT_DATE
        ),
        'success_rate', (
            SELECT CASE WHEN COUNT(*) = 0 THEN NULL
                   ELSE ROUND(COUNT(*) FILTER (WHERE outcome = 'success')::NUMERIC / COUNT(*) * 100, 1)
                   END
            FROM agent_decisions
            WHERE agent_id = r.agent_id
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        )
    ) ORDER BY
        CASE r.role WHEN 'brain' THEN 0 WHEN 'executive' THEN 1 WHEN 'department_head' THEN 2 ELSE 3 END,
        r.agent_id
    ), '[]'::JSONB)
    INTO v_result
    FROM agent_roster r
    WHERE r.status = 'active';

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- 5. RPC: Get action timeline (what did the company DO today?)
--    Combines signals + decisions into a unified timeline.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_action_timeline(p_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(item ORDER BY ts DESC), '[]'::JSONB)
    INTO v_result
    FROM (
        -- Agent decisions
        SELECT jsonb_build_object(
            'type', 'decision',
            'ts', d.created_at,
            'agent_id', d.agent_id,
            'action', d.action_type,
            'reason', d.reasoning,
            'outcome', d.outcome,
            'success', d.outcome = 'success'
        ) as item, d.created_at as ts
        FROM agent_decisions d
        WHERE d.created_at >= CURRENT_DATE
        ORDER BY d.created_at DESC
        LIMIT p_limit

        UNION ALL

        -- Key signals (not all — just the important ones)
        SELECT jsonb_build_object(
            'type', 'signal',
            'ts', s.created_at,
            'agent_id', COALESCE(s.data->>'agent_id', split_part(s.event_type, '.', 1)),
            'action', s.event_type,
            'reason', NULL,
            'outcome', NULL,
            'success', NULL
        ) as item, s.created_at as ts
        FROM signals s
        WHERE s.created_at >= CURRENT_DATE
        AND s.event_type IN (
            'brain.heartbeat', 'intel.detected', 'content.generated',
            'executive.council_completed', 'department.sync_completed',
            'payment.recovered', 'support.auto_resolved', 'booking.created'
        )
        ORDER BY s.created_at DESC
        LIMIT p_limit
    ) combined
    LIMIT p_limit;

    RETURN v_result;
END;
$$;
