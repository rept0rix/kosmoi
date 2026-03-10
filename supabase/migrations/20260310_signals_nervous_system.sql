-- ============================================================
-- SIGNALS TABLE — The Central Nervous System of Kosmoi
-- ============================================================
-- Every meaningful event from every Edge Function writes here.
-- The autonomous brain reads from here to make decisions.
-- Pattern: Observe (signals) → Think (brain) → Act (tools)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.signals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What happened
    event_type   TEXT NOT NULL,
    -- Examples: 'payment.received', 'email.opened', 'lead.scouted',
    --           'claim.attempted', 'user.signup', 'subscription.cancelled',
    --           'invitation.sent', 'review.posted', 'booking.completed'

    -- Who/what it's about
    entity_type  TEXT NOT NULL DEFAULT 'unknown',
    -- 'user', 'provider', 'booking', 'invitation', 'subscription', 'system'
    entity_id    UUID,
    -- The actual user_id, provider_id, booking_id, etc.

    -- Source
    source       TEXT NOT NULL DEFAULT 'unknown',
    -- Which Edge Function or service wrote this: 'stripe-webhook', 'sales-scout',
    -- 'retention-agent', 'cron-worker', 'agent-worker', 'frontend'

    -- Payload
    data         JSONB NOT NULL DEFAULT '{}',
    -- Full context: amounts, email addresses, action types, results, etc.

    -- Brain processing state
    processed    BOOLEAN NOT NULL DEFAULT false,
    -- false = brain hasn't seen this yet
    -- true  = brain has processed this signal

    processed_at TIMESTAMPTZ,
    -- When the brain processed it

    brain_action JSONB,
    -- What action the brain decided to take in response (audit trail)

    -- Metadata
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Optimized for brain's query pattern
-- ============================================================

-- Primary brain query: "What haven't I seen yet?"
CREATE INDEX IF NOT EXISTS idx_signals_unprocessed
    ON public.signals (created_at DESC)
    WHERE processed = false;

-- Secondary query: "What happened to this specific user/provider?"
CREATE INDEX IF NOT EXISTS idx_signals_entity
    ON public.signals (entity_type, entity_id, created_at DESC);

-- Pattern analysis: "How many payments in last 24h?"
CREATE INDEX IF NOT EXISTS idx_signals_event_type
    ON public.signals (event_type, created_at DESC);

-- Source debugging: "How many signals from stripe today?"
CREATE INDEX IF NOT EXISTS idx_signals_source
    ON public.signals (source, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Functions) can do everything
CREATE POLICY "Service role manages signals"
    ON public.signals
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Admins can read all signals (for monitoring dashboard)
CREATE POLICY "Admins can read signals"
    ON public.signals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- HELPER FUNCTION: write_signal()
-- ============================================================
-- Call this from any Edge Function to record an event:
-- SELECT write_signal('payment.received', 'user', user_id, 'stripe-webhook', '{"amount": 1500}')
-- ============================================================

CREATE OR REPLACE FUNCTION public.write_signal(
    p_event_type  TEXT,
    p_entity_type TEXT,
    p_entity_id   UUID,
    p_source      TEXT,
    p_data        JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_signal_id UUID;
BEGIN
    INSERT INTO public.signals (event_type, entity_type, entity_id, source, data)
    VALUES (p_event_type, p_entity_type, p_entity_id, p_source, p_data)
    RETURNING id INTO v_signal_id;

    RETURN v_signal_id;
END;
$$;

-- ============================================================
-- STRATEGY STORE — Persistent memory for autonomous brain
-- ============================================================
-- The brain writes its conclusions here so they survive restarts.
-- Each strategy has a confidence score that updates over time.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.strategy_store (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT NOT NULL UNIQUE,
    -- Human-readable key: 'optimal_send_time', 'best_lead_category', 'churn_risk_threshold'

    value       JSONB NOT NULL DEFAULT '{}',
    -- The strategy content and its parameters

    confidence  FLOAT NOT NULL DEFAULT 0.5,
    -- 0.0 = pure guess, 1.0 = proven by results
    -- Updates when the brain observes outcomes

    version     INTEGER NOT NULL DEFAULT 1,
    -- Increments on each update (audit trail)

    last_tested TIMESTAMPTZ,
    -- When was this strategy last A/B tested?

    notes       TEXT,
    -- Human-readable explanation of why this strategy exists

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.strategy_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages strategy"
    ON public.strategy_store FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read strategy"
    ON public.strategy_store FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_strategy_store_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$;

CREATE TRIGGER strategy_store_updated
    BEFORE UPDATE ON public.strategy_store
    FOR EACH ROW EXECUTE FUNCTION update_strategy_store_timestamp();

-- ============================================================
-- SEED: Initial strategies (brain's baseline knowledge)
-- ============================================================

INSERT INTO public.strategy_store (key, value, confidence, notes)
VALUES
    (
        'email_send_window',
        '{"best_hour_utc": 2, "best_days": ["monday", "tuesday", "wednesday"], "avoid_days": ["saturday", "sunday"]}',
        0.5,
        'Initial guess: 9 AM Thailand time (UTC+7). Will update based on open rates.'
    ),
    (
        'lead_priority_categories',
        '{"priority_order": ["restaurant", "wellness", "accommodation", "shopping", "other"], "min_rating": 3.5}',
        0.5,
        'Initial guess based on market research. Will update based on claim conversion rates.'
    ),
    (
        'outreach_sequence',
        '{"day_0": "invitation_email", "day_3": "follow_up_1", "day_7": "follow_up_2", "day_14": "final_offer"}',
        0.5,
        'Standard 4-touch outreach sequence. Will optimize based on response rates.'
    ),
    (
        'churn_risk_signals',
        '{"no_login_days": 14, "no_booking_days": 30, "support_tickets_threshold": 3}',
        0.5,
        'Thresholds for identifying churn risk. Will calibrate based on actual churn data.'
    ),
    (
        'platform_health_targets',
        '{"min_active_providers": 50, "min_monthly_bookings": 20, "target_claim_rate": 0.15, "target_trial_conversion": 0.3}',
        0.8,
        'Business targets. High confidence — set by founder.'
    )
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- COMPANY GOALS TABLE — What is the brain trying to achieve?
-- ============================================================
-- This is different from the existing user goals table.
-- These are platform-level OKRs the autonomous brain tracks.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_goals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT,
    metric_key  TEXT NOT NULL,
    -- What to measure: 'claimed_providers', 'monthly_revenue_thb', 'active_users'

    target_value FLOAT NOT NULL,
    current_value FLOAT NOT NULL DEFAULT 0,

    deadline    DATE,
    status      TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'achieved', 'missed', 'paused')),

    priority    INTEGER NOT NULL DEFAULT 5,
    -- 1 = highest, 10 = lowest

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.company_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages goals"
    ON public.company_goals FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read goals"
    ON public.company_goals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Seed initial platform goals
INSERT INTO public.company_goals (title, description, metric_key, target_value, deadline, priority)
VALUES
    (
        'Reach 100 Claimed Providers',
        'Get 100 businesses to claim their profile on Kosmoi',
        'claimed_providers',
        100,
        '2026-06-01',
        1
    ),
    (
        'First 50,000 ฿ MRR',
        'Monthly Recurring Revenue from subscriptions',
        'monthly_revenue_thb',
        50000,
        '2026-06-01',
        2
    ),
    (
        '500 Active Users',
        'Users with at least 1 booking in last 30 days',
        'active_users',
        500,
        '2026-06-01',
        3
    ),
    (
        '4.5+ Platform Rating',
        'Average rating across all providers',
        'avg_provider_rating',
        4.5,
        '2026-12-01',
        4
    )
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
-- Tables created:
--   public.signals       — Central event stream (the nervous system)
--   public.strategy_store — Brain's persistent memory
--   public.company_goals  — Platform-level OKRs
--
-- Functions created:
--   public.write_signal() — Helper to write events from Edge Functions
--
-- Next step: Connect stripe-webhook, sales-scout, retention-agent
-- to call write_signal() after every meaningful action.
-- ============================================================
