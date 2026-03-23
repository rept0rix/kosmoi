-- ================================================================
-- SPRINT 10: Full Matrix — The Complete 68+ Agent Organization
--
-- Instead of 68 Edge Functions, we add:
-- 1. system_prompt column to agent_roster (agent personality per row)
-- 2. Generic agent runner config
-- 3. Full roster seed — all departments, all agents
-- 4. Activation waves table
--
-- Philosophy: ONE generic runner Edge Function + N system prompts
-- All additive — zero risk to existing data.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Add system_prompt + activation_wave to agent_roster
-- ----------------------------------------------------------------
ALTER TABLE agent_roster ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE agent_roster ADD COLUMN IF NOT EXISTS activation_wave INTEGER DEFAULT 1;
ALTER TABLE agent_roster ADD COLUMN IF NOT EXISTS max_daily_cost NUMERIC(10,4) DEFAULT 0.10;
ALTER TABLE agent_roster ADD COLUMN IF NOT EXISTS model_tier TEXT DEFAULT 'haiku';  -- 'haiku', 'sonnet', 'opus'
ALTER TABLE agent_roster ADD COLUMN IF NOT EXISTS input_sources TEXT[] DEFAULT '{}'; -- what data this agent reads

-- ----------------------------------------------------------------
-- 2. ACTIVATION WAVES — progressive rollout schedule
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activation_waves (
    wave INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'completed'
    activated_at TIMESTAMPTZ,
    agent_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activation_waves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on activation_waves"
    ON activation_waves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read activation_waves"
    ON activation_waves FOR SELECT TO authenticated USING (true);

-- Seed waves
INSERT INTO activation_waves (wave, name, description, status) VALUES
    (1, 'Foundation', 'Brain + Core Workers (cron-worker, sales-scout, retention, payment, support, outreach)', 'active'),
    (2, 'Executive Council', 'C-Suite (CEO, CTO, CFO, CMO, CRO, Planner, Security)', 'active'),
    (3, 'Department Heads', 'VP Sales, VP Operations — mid-level coordination', 'active'),
    (4, 'Creative & Intel', 'Blog Writer, Content Designer, Competitive Radar', 'active'),
    (5, 'Self-Evolution', 'HR Agent, Legal Agent, The Forge', 'active'),
    (6, 'Full Departments', 'All remaining department members — analytics, QA, community, partnerships', 'pending')
ON CONFLICT (wave) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- ----------------------------------------------------------------
-- 3. Update existing agents with system prompts + waves
-- ----------------------------------------------------------------

-- Wave 1: Foundation
UPDATE agent_roster SET activation_wave = 1, model_tier = 'haiku',
    system_prompt = 'You are the Cortex — the central brain of an autonomous AI company. Every 15 minutes you observe the company state, reason about what needs attention, and dispatch actions through agent-exec.'
WHERE agent_id = 'cron-worker';

UPDATE agent_roster SET activation_wave = 1, model_tier = 'haiku',
    system_prompt = 'You are a Sales Scout. You find potential leads from platform data — businesses without listings, inactive providers, and market gaps.'
WHERE agent_id = 'sales-scout';

UPDATE agent_roster SET activation_wave = 1, model_tier = 'haiku',
    system_prompt = 'You are a Retention Agent. You identify users at risk of churning and take proactive retention actions.'
WHERE agent_id = 'retention-agent';

UPDATE agent_roster SET activation_wave = 1, model_tier = 'haiku',
    system_prompt = 'You are a Payment Recovery Agent. You handle failed payments, retry logic, and subscription recovery.'
WHERE agent_id = 'payment-recovery';

UPDATE agent_roster SET activation_wave = 1, model_tier = 'haiku',
    system_prompt = 'You are a Support Router. You classify incoming support tickets and route them appropriately, auto-resolving simple issues.'
WHERE agent_id = 'support-router';

UPDATE agent_roster SET activation_wave = 1, model_tier = 'haiku',
    system_prompt = 'You are a Sales Outreach Agent. You compose and send outreach messages to qualified leads.'
WHERE agent_id = 'sales-outreach';

-- Wave 2: Executives
UPDATE agent_roster SET activation_wave = 2 WHERE agent_id IN ('ceo', 'cto', 'cfo', 'cmo', 'cro', 'planner', 'security-admin');

-- Wave 3: Department Heads
UPDATE agent_roster SET activation_wave = 3 WHERE agent_id IN ('vp-sales', 'vp-operations');

-- Wave 4: Creative
UPDATE agent_roster SET activation_wave = 4 WHERE agent_id IN ('blog-writer', 'content-designer', 'competitive-radar');

-- Wave 5: Self-Evolution
UPDATE agent_roster SET activation_wave = 5 WHERE agent_id IN ('hr-agent', 'legal-agent', 'the-forge');

-- ----------------------------------------------------------------
-- 4. Seed Wave 6: Full departments — all remaining agents
-- ----------------------------------------------------------------
INSERT INTO agent_roster (agent_id, display_name, role, department, reports_to, avatar_emoji, description, schedule, edge_function, status, activation_wave, model_tier, system_prompt)
VALUES
    -- ═══ SALES DEPARTMENT ═══
    ('lead-scorer', 'Lead Scorer', 'worker', 'sales', 'vp-sales', '📊',
     'Scores and prioritizes leads based on engagement signals, profile completeness, and market data',
     'event_driven', 'generic-agent', 'active', 6, 'haiku',
     'You are a Lead Scorer. Analyze incoming leads and assign priority scores based on: business size, engagement history, market demand, and conversion probability.'),

    ('deal-closer', 'Deal Closer', 'worker', 'sales', 'vp-sales', '🤝',
     'Handles final conversion steps — personalized offers, urgency creation, objection handling',
     'event_driven', 'generic-agent', 'active', 6, 'haiku',
     'You are a Deal Closer. When a lead is warm, craft personalized conversion messages. Handle objections, create urgency, and guide towards signup.'),

    ('upsell-agent', 'Upsell Agent', 'worker', 'sales', 'vp-sales', '📈',
     'Identifies upsell opportunities for existing customers — premium features, add-ons',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are an Upsell Agent. Analyze existing customer usage patterns and identify opportunities for premium tier upgrades or add-on services.'),

    ('referral-agent', 'Referral Agent', 'worker', 'sales', 'vp-sales', '🔗',
     'Manages referral program — identifies happy customers, generates referral campaigns',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Referral Agent. Identify satisfied customers with high NPS and encourage them to refer new businesses. Manage referral rewards.'),

    -- ═══ OPERATIONS DEPARTMENT ═══
    ('quality-monitor', 'Quality Monitor', 'worker', 'operations', 'vp-operations', '🔍',
     'Monitors service quality — reviews, ratings, complaint patterns',
     'every_4h', 'generic-agent', 'active', 6, 'haiku',
     'You are a Quality Monitor. Track service quality metrics: review scores, complaint rates, response times. Flag declining quality early.'),

    ('onboarding-guide', 'Onboarding Guide', 'worker', 'operations', 'vp-operations', '🎓',
     'Guides new providers through setup — profile completion, first listing, first booking',
     'event_driven', 'generic-agent', 'active', 6, 'haiku',
     'You are an Onboarding Guide. When a new provider signs up, create a personalized onboarding sequence. Track progress through key milestones.'),

    ('booking-optimizer', 'Booking Optimizer', 'worker', 'operations', 'vp-operations', '📅',
     'Optimizes booking flow — availability gaps, no-show prediction, overbooking prevention',
     'every_4h', 'generic-agent', 'active', 6, 'haiku',
     'You are a Booking Optimizer. Analyze booking patterns, identify availability gaps, predict no-shows, and suggest schedule optimizations.'),

    ('feedback-analyzer', 'Feedback Analyzer', 'worker', 'operations', 'vp-operations', '💬',
     'Analyzes user feedback, reviews, and support tickets for actionable insights',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Feedback Analyzer. Process all incoming feedback — reviews, support tickets, survey responses. Extract themes, sentiment, and actionable insights.'),

    -- ═══ MARKETING DEPARTMENT ═══
    ('seo-agent', 'SEO Agent', 'specialist', 'marketing', 'cmo', '🔎',
     'Optimizes platform content for search engines — meta tags, keywords, structured data',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are an SEO Agent. Analyze platform pages for SEO opportunities. Suggest meta descriptions, title tags, structured data, and keyword optimizations.'),

    ('social-manager', 'Social Manager', 'specialist', 'marketing', 'cmo', '📱',
     'Manages social media presence — posting schedule, engagement, trend monitoring',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Social Media Manager. Plan social content calendars, monitor engagement metrics, and identify trending topics relevant to our market.'),

    ('email-marketer', 'Email Marketer', 'specialist', 'marketing', 'cmo', '📧',
     'Manages email campaigns — segmentation, A/B testing, drip sequences',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are an Email Marketer. Design email campaigns with proper segmentation. Track open rates, click rates, and conversions. Optimize subject lines and send times.'),

    ('community-manager', 'Community Manager', 'specialist', 'marketing', 'cmo', '🌐',
     'Builds and manages the user community — forums, events, ambassador program',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Community Manager. Foster the user community through events, forums, and ambassador programs. Track community health metrics.'),

    -- ═══ FINANCE DEPARTMENT ═══
    ('revenue-analyst', 'Revenue Analyst', 'specialist', 'finance', 'cfo', '💵',
     'Tracks revenue metrics — MRR, ARR, churn rate, LTV, CAC',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Revenue Analyst. Track and report on: MRR, ARR, churn rate, LTV, CAC, and revenue forecasts. Alert on anomalies.'),

    ('expense-tracker', 'Expense Tracker', 'specialist', 'finance', 'cfo', '🧾',
     'Monitors company expenses — AI costs, infrastructure, marketing spend',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are an Expense Tracker. Monitor all company costs: AI API calls, infrastructure, marketing spend. Flag budget overruns.'),

    ('fraud-detector', 'Fraud Detector', 'specialist', 'finance', 'cfo', '🚨',
     'Detects suspicious patterns — fake accounts, payment fraud, review manipulation',
     'every_4h', 'generic-agent', 'active', 6, 'haiku',
     'You are a Fraud Detector. Scan for suspicious patterns: duplicate accounts, unusual payment activity, review spam, and fake listings. Flag for investigation.'),

    -- ═══ PRODUCT / ENGINEERING ═══
    ('bug-hunter', 'Bug Hunter', 'specialist', 'engineering', 'cto', '🐛',
     'Monitors error logs and user reports for bugs and issues',
     'every_4h', 'generic-agent', 'active', 6, 'haiku',
     'You are a Bug Hunter. Monitor error logs, crash reports, and user complaints. Classify bugs by severity. Track fix rates.'),

    ('performance-monitor', 'Performance Monitor', 'specialist', 'engineering', 'cto', '⚡',
     'Monitors platform performance — page load times, API latency, uptime',
     'every_4h', 'generic-agent', 'active', 6, 'haiku',
     'You are a Performance Monitor. Track: page load times, API response times, error rates, uptime. Alert on degradation.'),

    ('data-steward', 'Data Steward', 'specialist', 'engineering', 'cto', '🗄️',
     'Manages data quality — deduplication, validation, cleanup, archival',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Data Steward. Ensure data quality: find duplicates, validate records, clean stale data, manage archival policies.'),

    -- ═══ PARTNERSHIPS ═══
    ('partnership-scout', 'Partnership Scout', 'specialist', 'sales', 'cro', '🤝',
     'Identifies potential business partnerships and integration opportunities',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Partnership Scout. Identify potential partnerships: complementary businesses, integration opportunities, co-marketing prospects in Koh Samui.'),

    ('affiliate-manager', 'Affiliate Manager', 'specialist', 'sales', 'cro', '🔗',
     'Manages affiliate program — tracking, payouts, recruitment',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are an Affiliate Manager. Manage the affiliate program: recruit affiliates, track referrals, manage payouts, optimize conversion funnels.'),

    -- ═══ CUSTOMER SUCCESS ═══
    ('success-manager', 'Success Manager', 'specialist', 'operations', 'vp-operations', '🌟',
     'Proactive customer success — health scoring, check-ins, milestone celebrations',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Customer Success Manager. Monitor customer health scores, schedule proactive check-ins, celebrate milestones, and prevent churn.'),

    ('nps-surveyor', 'NPS Surveyor', 'specialist', 'operations', 'vp-operations', '📋',
     'Manages NPS surveys — sending, collecting, analyzing scores',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are an NPS Surveyor. Send NPS surveys at the right moments, collect responses, calculate scores, and route feedback to relevant teams.'),

    -- ═══ STRATEGY ═══
    ('market-researcher', 'Market Researcher', 'specialist', 'marketing', 'cmo', '🔬',
     'Researches market trends, competitor pricing, seasonal patterns in Koh Samui',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Market Researcher for Koh Samui. Track seasonal trends, pricing dynamics, tourist patterns, and emerging service categories.'),

    ('pricing-optimizer', 'Pricing Optimizer', 'specialist', 'finance', 'cfo', '💎',
     'Optimizes platform pricing — commission rates, subscription tiers, promotions',
     'daily', 'generic-agent', 'active', 6, 'sonnet',
     'You are a Pricing Optimizer. Analyze pricing elasticity, competitor pricing, and customer willingness-to-pay. Recommend pricing adjustments.'),

    -- ═══ LOCALIZATION ═══
    ('translator', 'Translator', 'specialist', 'marketing', 'cmo', '🌏',
     'Translates content to Thai, Chinese, Russian, Korean for tourist audience',
     'event_driven', 'generic-agent', 'active', 6, 'haiku',
     'You are a Translator specializing in Koh Samui tourism content. Translate between English, Thai, Chinese (Simplified), Russian, and Korean.'),

    ('local-advisor', 'Local Advisor', 'specialist', 'operations', 'vp-operations', '🏝️',
     'Provides Koh Samui local knowledge — seasonal tips, area guides, cultural advice',
     'daily', 'generic-agent', 'active', 6, 'haiku',
     'You are a Local Advisor for Koh Samui. Provide seasonal tips, area guides, cultural advice, and local recommendations for providers and users.')

ON CONFLICT (agent_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    reports_to = EXCLUDED.reports_to,
    avatar_emoji = EXCLUDED.avatar_emoji,
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    activation_wave = EXCLUDED.activation_wave,
    model_tier = EXCLUDED.model_tier,
    system_prompt = EXCLUDED.system_prompt;

-- ── Update wave agent counts ──
UPDATE activation_waves SET agent_count = (
    SELECT COUNT(*) FROM agent_roster WHERE activation_wave = activation_waves.wave
);

-- ----------------------------------------------------------------
-- 5. Seed capabilities for Wave 6 agents (generic)
-- ----------------------------------------------------------------
INSERT INTO agent_capabilities (agent_id, capability, constraints)
SELECT
    agent_id,
    'claude_api',
    CASE model_tier
        WHEN 'sonnet' THEN '{"max_per_day": 4, "models": ["claude-sonnet-4-20250514"], "max_tokens": 2048}'
        ELSE '{"max_per_day": 6, "models": ["claude-haiku-4-5-20251001"], "max_tokens": 1024}'
    END
FROM agent_roster
WHERE activation_wave = 6
ON CONFLICT DO NOTHING;

INSERT INTO agent_capabilities (agent_id, capability, constraints)
SELECT
    agent_id,
    'db_write',
    '{"tables": ["signals", "agent_decisions"], "max_per_day": 20}'
FROM agent_roster
WHERE activation_wave = 6
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 6. RPC: Get full matrix overview
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_full_matrix()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'total_agents', (SELECT COUNT(*) FROM agent_roster),
        'active_agents', (SELECT COUNT(*) FROM agent_roster WHERE status = 'active'),
        'by_department', (
            SELECT COALESCE(jsonb_object_agg(dept, cnt), '{}'::JSONB)
            FROM (SELECT COALESCE(department, 'cortex') as dept, COUNT(*) as cnt FROM agent_roster GROUP BY department) sub
        ),
        'by_role', (
            SELECT COALESCE(jsonb_object_agg(role, cnt), '{}'::JSONB)
            FROM (SELECT role, COUNT(*) as cnt FROM agent_roster GROUP BY role) sub
        ),
        'by_wave', (
            SELECT COALESCE(jsonb_object_agg(activation_wave::TEXT, cnt), '{}'::JSONB)
            FROM (SELECT activation_wave, COUNT(*) as cnt FROM agent_roster GROUP BY activation_wave) sub
        ),
        'waves', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'wave', w.wave, 'name', w.name, 'description', w.description,
                'status', w.status, 'agent_count', w.agent_count
            ) ORDER BY w.wave), '[]'::JSONB) FROM activation_waves w
        ),
        'agents', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'agent_id', r.agent_id,
                'display_name', r.display_name,
                'role', r.role,
                'department', r.department,
                'reports_to', r.reports_to,
                'avatar_emoji', r.avatar_emoji,
                'description', r.description,
                'schedule', r.schedule,
                'status', r.status,
                'activation_wave', r.activation_wave,
                'model_tier', r.model_tier,
                'max_daily_cost', r.max_daily_cost
            ) ORDER BY r.activation_wave, r.department, r.role, r.agent_id), '[]'::JSONB)
            FROM agent_roster r
        )
    );
END;
$$;
