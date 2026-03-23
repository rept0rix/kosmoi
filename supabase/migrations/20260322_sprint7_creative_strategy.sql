-- ================================================================
-- SPRINT 7: Creative & Strategy Layer
--
-- New tables: content_queue, competitive_intel
-- New agents: blog-writer, competitive-radar, content-designer
-- These agents are EVENT-DRIVEN, not cron-based.
-- They react to signals or department directives.
-- All additive — zero risk to existing data.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. CONTENT QUEUE — tracks all content generation requests
--    Blog posts, social copy, meta descriptions, visual briefs.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,          -- 'blog_post', 'social_copy', 'meta_description', 'visual_brief', 'email_template'
    title TEXT,
    prompt TEXT NOT NULL,                -- what to write about
    context JSONB DEFAULT '{}',         -- signals, metrics, or events that triggered this
    status TEXT NOT NULL DEFAULT 'queued',  -- 'queued', 'generating', 'review', 'published', 'rejected'
    result JSONB DEFAULT '{}',          -- generated content: { body, meta, tags, images }
    requested_by TEXT NOT NULL,         -- agent_id that requested it
    generated_by TEXT,                  -- agent_id that created the content
    model_used TEXT,                    -- which AI model was used
    target_audience TEXT,               -- 'providers', 'users', 'both', 'investors'
    publish_to TEXT[],                  -- ['blog', 'facebook', 'instagram', 'email']
    scheduled_for TIMESTAMPTZ,          -- when to publish (NULL = ASAP)
    published_at TIMESTAMPTZ,
    quality_score NUMERIC(3,1),         -- 0-10, set during review
    tokens_used INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status) WHERE status IN ('queued', 'generating');
CREATE INDEX IF NOT EXISTS idx_content_queue_type ON content_queue(content_type, created_at DESC);

ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on content_queue"
    ON content_queue FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read content_queue"
    ON content_queue FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 2. COMPETITIVE INTEL — intelligence gathered by the radar
--    Stores competitor snapshots, pricing changes, new features.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitive_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_name TEXT NOT NULL,
    competitor_url TEXT,
    intel_type TEXT NOT NULL,            -- 'pricing_change', 'new_feature', 'market_move', 'review_sentiment', 'social_trend'
    severity TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    summary TEXT NOT NULL,               -- human-readable summary
    raw_data JSONB DEFAULT '{}',        -- scraped/analyzed data
    our_response JSONB,                 -- what we should do about it (set by CMO/CRO)
    response_status TEXT DEFAULT 'pending', -- 'pending', 'acknowledged', 'acting', 'resolved', 'ignored'
    detected_by TEXT NOT NULL DEFAULT 'competitive-radar',
    reviewed_by TEXT,                    -- executive who reviewed it
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compintel_severity ON competitive_intel(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compintel_competitor ON competitive_intel(competitor_name);
CREATE INDEX IF NOT EXISTS idx_compintel_status ON competitive_intel(response_status) WHERE response_status = 'pending';

ALTER TABLE competitive_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on competitive_intel"
    ON competitive_intel FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read competitive_intel"
    ON competitive_intel FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- 3. Add Creative agents to the roster
-- ----------------------------------------------------------------
INSERT INTO agent_roster (agent_id, display_name, role, department, reports_to, avatar_emoji, description, schedule, edge_function, status)
VALUES
    -- Creative team under CMO
    ('blog-writer', 'Blog Writer', 'specialist', 'marketing', 'cmo', '✍️',
     'Generates blog posts, articles, and long-form content based on platform events and market trends',
     'event_driven', 'content-generator', 'active'),
    ('content-designer', 'Content Designer', 'specialist', 'marketing', 'cmo', '🎨',
     'Creates meta descriptions, social copy, email templates, and visual briefs',
     'event_driven', 'content-generator', 'active'),
    ('competitive-radar', 'Competitive Radar', 'specialist', 'marketing', 'cmo', '📡',
     'Monitors competitors, market trends, and industry changes. Reports intelligence to CMO',
     'every_4h', 'competitive-radar', 'active')
ON CONFLICT (agent_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    reports_to = EXCLUDED.reports_to,
    avatar_emoji = EXCLUDED.avatar_emoji,
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    edge_function = EXCLUDED.edge_function;

-- ----------------------------------------------------------------
-- 4. Capabilities for new agents
-- ----------------------------------------------------------------
INSERT INTO agent_capabilities (agent_id, capability, constraints) VALUES
    ('blog-writer', 'claude_api', '{"max_per_day": 10, "models": ["claude-haiku-4-5-20251001"], "max_tokens": 4096}'),
    ('blog-writer', 'db_write', '{"tables": ["content_queue", "blog_posts"], "max_per_day": 10}'),
    ('content-designer', 'claude_api', '{"max_per_day": 20, "models": ["claude-haiku-4-5-20251001"], "max_tokens": 2048}'),
    ('content-designer', 'db_write', '{"tables": ["content_queue"], "max_per_day": 20}'),
    ('competitive-radar', 'claude_api', '{"max_per_day": 6, "models": ["claude-haiku-4-5-20251001"], "max_tokens": 2048}'),
    ('competitive-radar', 'db_write', '{"tables": ["competitive_intel", "signals"], "max_per_day": 20}'),
    ('competitive-radar', 'external_api', '{"allowed_domains": ["*.google.com", "*.bing.com"], "max_per_day": 12}')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 5. RPC: Queue content generation request
--    Any agent can request content via this function.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION queue_content(
    p_content_type TEXT,
    p_prompt TEXT,
    p_requested_by TEXT,
    p_context JSONB DEFAULT '{}',
    p_target_audience TEXT DEFAULT 'both',
    p_publish_to TEXT[] DEFAULT ARRAY['blog'],
    p_scheduled_for TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO content_queue (content_type, prompt, requested_by, context, target_audience, publish_to, scheduled_for)
    VALUES (p_content_type, p_prompt, p_requested_by, p_context, p_target_audience, p_publish_to, p_scheduled_for)
    RETURNING id INTO v_id;

    -- Write a signal so the content-generator knows there's work
    PERFORM write_signal(
        'content.queued',
        v_id::TEXT,
        jsonb_build_object(
            'content_type', p_content_type,
            'requested_by', p_requested_by,
            'prompt_preview', LEFT(p_prompt, 100)
        )
    );

    RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------
-- 6. RPC: Get content generation stats
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_content_stats()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'queued', COUNT(*) FILTER (WHERE status = 'queued'),
        'generating', COUNT(*) FILTER (WHERE status = 'generating'),
        'review', COUNT(*) FILTER (WHERE status = 'review'),
        'published', COUNT(*) FILTER (WHERE status = 'published'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'avg_quality', ROUND(AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL), 1),
        'total_tokens', COALESCE(SUM(tokens_used), 0),
        'by_type', jsonb_object_agg(
            COALESCE(sub.content_type, 'unknown'),
            sub.cnt
        )
    ) INTO v_result
    FROM content_queue
    LEFT JOIN LATERAL (
        SELECT content_type, COUNT(*) as cnt
        FROM content_queue
        GROUP BY content_type
    ) sub ON true;

    -- Simpler version if lateral join fails
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'queued', COUNT(*) FILTER (WHERE status = 'queued'),
        'generating', COUNT(*) FILTER (WHERE status = 'generating'),
        'review', COUNT(*) FILTER (WHERE status = 'review'),
        'published', COUNT(*) FILTER (WHERE status = 'published'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'avg_quality', ROUND(AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL), 1),
        'total_tokens', COALESCE(SUM(tokens_used), 0)
    ) INTO v_result
    FROM content_queue;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------
-- 7. RPC: Get pending competitive intel
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_pending_intel(p_limit INTEGER DEFAULT 20)
RETURNS SETOF competitive_intel
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT * FROM competitive_intel
    WHERE response_status = 'pending'
    ORDER BY
        CASE severity
            WHEN 'critical' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            ELSE 3
        END,
        created_at DESC
    LIMIT p_limit;
$$;
