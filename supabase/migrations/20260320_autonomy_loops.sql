-- ============================================================
-- AUTONOMY LOOPS MIGRATION
-- Phase 2: KPI Watchdog  (update_daily_kpi_snapshot + cron)
-- Phase 3: Goal → Task   (evaluate_goals_and_create_tasks + cron)
-- Phase 5: Strategy Learn (update_strategy_confidence + weekly cron)
-- ============================================================

-- ============================================================
-- PHASE 2: KPI WATCHDOG — update_daily_kpi_snapshot()
-- Called daily by pg_cron so kpi_snapshots stays current.
-- cron-worker reads this to detect metric breaches.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_daily_kpi_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leads_today       INTEGER;
    v_bookings_today    INTEGER;
    v_verified          INTEGER;
    v_active_providers  INTEGER;
    v_new_businesses    INTEGER;
BEGIN
    -- Count new service providers added today (new leads)
    SELECT COUNT(*)
      INTO v_leads_today
      FROM public.service_providers
     WHERE DATE(created_at) = CURRENT_DATE;

    -- Count bookings created today
    SELECT COUNT(*)
      INTO v_bookings_today
      FROM public.bookings
     WHERE DATE(created_at) = CURRENT_DATE;

    -- Total verified / claimed businesses
    SELECT COUNT(*)
      INTO v_verified
      FROM public.service_providers
     WHERE verified = true;

    -- Active (status = active) providers
    SELECT COUNT(*)
      INTO v_active_providers
      FROM public.service_providers
     WHERE status = 'active';

    -- New businesses added today (scouted or registered)
    SELECT COUNT(*)
      INTO v_new_businesses
      FROM public.service_providers
     WHERE DATE(created_at) = CURRENT_DATE;

    -- Upsert today's snapshot
    INSERT INTO public.kpi_snapshots
        (snapshot_date, leads_today, bookings_today, verified_businesses, active_providers, new_businesses_today)
    VALUES
        (CURRENT_DATE, v_leads_today, v_bookings_today, v_verified, v_active_providers, v_new_businesses)
    ON CONFLICT (snapshot_date) DO UPDATE
      SET leads_today          = EXCLUDED.leads_today,
          bookings_today       = EXCLUDED.bookings_today,
          verified_businesses  = EXCLUDED.verified_businesses,
          active_providers     = EXCLUDED.active_providers,
          new_businesses_today = EXCLUDED.new_businesses_today,
          metadata             = jsonb_build_object('updated_at', NOW());

    -- Write signal so brain knows fresh KPI data is available
    PERFORM public.write_signal(
        'kpi.snapshot_updated',
        'system',
        NULL,
        'kpi-watchdog',
        jsonb_build_object(
            'leads_today', v_leads_today,
            'bookings_today', v_bookings_today,
            'verified_businesses', v_verified,
            'active_providers', v_active_providers
        )
    );
END;
$$;

-- ============================================================
-- PHASE 2: KPI BREACH HELPER — get_kpi_breaches()
-- Returns list of metrics that breached warning/critical thresholds today.
-- Called by cron-worker in the REASON phase.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_kpi_breaches()
RETURNS TABLE (
    metric_name      TEXT,
    current_value    NUMERIC,
    warning_threshold NUMERIC,
    critical_threshold NUMERIC,
    severity         TEXT  -- 'warning' | 'critical'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snap kpi_snapshots%ROWTYPE;
BEGIN
    -- Get today's snapshot (or return empty if none yet)
    SELECT * INTO v_snap
      FROM public.kpi_snapshots
     WHERE snapshot_date = CURRENT_DATE
     LIMIT 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        t.metric_name,
        CASE t.metric_name
            WHEN 'leads_today'          THEN v_snap.leads_today::NUMERIC
            WHEN 'bookings_today'       THEN v_snap.bookings_today::NUMERIC
            WHEN 'verified_businesses'  THEN v_snap.verified_businesses::NUMERIC
            WHEN 'new_businesses_today' THEN v_snap.new_businesses_today::NUMERIC
            ELSE 0::NUMERIC
        END AS current_value,
        t.warning_threshold,
        t.critical_threshold,
        CASE
            WHEN (t.comparison = 'less_than' AND CASE t.metric_name
                    WHEN 'leads_today'          THEN v_snap.leads_today::NUMERIC
                    WHEN 'bookings_today'       THEN v_snap.bookings_today::NUMERIC
                    WHEN 'verified_businesses'  THEN v_snap.verified_businesses::NUMERIC
                    WHEN 'new_businesses_today' THEN v_snap.new_businesses_today::NUMERIC
                    ELSE 0::NUMERIC END <= t.critical_threshold)
                THEN 'critical'
            WHEN (t.comparison = 'less_than' AND CASE t.metric_name
                    WHEN 'leads_today'          THEN v_snap.leads_today::NUMERIC
                    WHEN 'bookings_today'       THEN v_snap.bookings_today::NUMERIC
                    WHEN 'verified_businesses'  THEN v_snap.verified_businesses::NUMERIC
                    WHEN 'new_businesses_today' THEN v_snap.new_businesses_today::NUMERIC
                    ELSE 0::NUMERIC END <= t.warning_threshold)
                THEN 'warning'
            ELSE NULL
        END AS severity
    FROM public.kpi_thresholds t
    WHERE CASE t.metric_name
            WHEN 'leads_today'          THEN v_snap.leads_today::NUMERIC
            WHEN 'bookings_today'       THEN v_snap.bookings_today::NUMERIC
            WHEN 'verified_businesses'  THEN v_snap.verified_businesses::NUMERIC
            WHEN 'new_businesses_today' THEN v_snap.new_businesses_today::NUMERIC
            ELSE 0::NUMERIC
          END <= t.warning_threshold
      AND t.comparison = 'less_than';
END;
$$;

-- ============================================================
-- PHASE 3: GOAL EVALUATION — evaluate_goals_and_create_tasks()
-- Reads company_goals, compares current vs target,
-- creates agent_tasks for goals that are off-track.
-- Called daily by cron.
-- ============================================================

CREATE OR REPLACE FUNCTION public.evaluate_goals_and_create_tasks()
RETURNS INTEGER  -- returns number of tasks created
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal          RECORD;
    v_current       NUMERIC;
    v_gap_pct       NUMERIC;
    v_days_left     INTEGER;
    v_urgency       TEXT;
    v_tasks_created INTEGER := 0;
    v_existing_task UUID;
BEGIN
    FOR v_goal IN
        SELECT * FROM public.company_goals
         WHERE status = 'active'
         ORDER BY priority ASC
    LOOP
        -- Compute current value from live data per metric_key
        v_current := CASE v_goal.metric_key
            WHEN 'claimed_providers'    THEN (SELECT COUNT(*)::NUMERIC FROM public.service_providers WHERE verified = true)
            WHEN 'monthly_revenue_thb'  THEN COALESCE((SELECT SUM(amount)::NUMERIC FROM public.transactions WHERE type = 'payment' AND created_at >= DATE_TRUNC('month', NOW())), 0)
            WHEN 'active_users'         THEN (SELECT COUNT(DISTINCT user_id)::NUMERIC FROM public.bookings WHERE created_at >= NOW() - INTERVAL '30 days')
            WHEN 'avg_provider_rating'  THEN COALESCE((SELECT AVG(average_rating)::NUMERIC FROM public.service_providers WHERE average_rating > 0), 0)
            ELSE v_goal.current_value
        END;

        -- Update current_value on the goal row
        UPDATE public.company_goals
           SET current_value    = v_current,
               last_evaluated_at = NOW()
         WHERE id = v_goal.id;

        -- Mark achieved if reached
        IF v_current >= v_goal.target_value THEN
            UPDATE public.company_goals SET status = 'achieved' WHERE id = v_goal.id;
            PERFORM public.write_signal(
                'goal.achieved',
                'system',
                v_goal.id,
                'goal-evaluator',
                jsonb_build_object('title', v_goal.title, 'metric', v_goal.metric_key, 'value', v_current)
            );
            CONTINUE;
        END IF;

        -- Calculate gap % and urgency
        v_gap_pct  := ROUND(((v_goal.target_value - v_current) / GREATEST(v_goal.target_value, 1)) * 100);
        v_days_left := COALESCE((v_goal.deadline - CURRENT_DATE)::INTEGER, 999);

        v_urgency := CASE
            WHEN v_gap_pct > 80 AND v_days_left < 30 THEN 'critical'
            WHEN v_gap_pct > 50                       THEN 'high'
            WHEN v_gap_pct > 20                       THEN 'medium'
            ELSE 'low'
        END;

        -- Only create task if off-track (gap > 20%) and no pending goal_correction task exists
        IF v_gap_pct > 20 AND v_goal.auto_task_enabled THEN
            SELECT id INTO v_existing_task
              FROM public.agent_tasks
             WHERE task_type = 'goal_correction'
               AND status IN ('pending', 'in_progress')
               AND context->>'goal_id' = v_goal.id::TEXT
             LIMIT 1;

            IF v_existing_task IS NULL THEN
                INSERT INTO public.agent_tasks
                    (title, description, status, priority, task_type, context, success_criteria)
                VALUES (
                    'Goal Off-Track: ' || v_goal.title,
                    format('Gap: %s%%. Current: %s / Target: %s. Days left: %s.',
                           v_gap_pct, v_current, v_goal.target_value, v_days_left),
                    'pending',
                    CASE v_urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
                    'goal_correction',
                    jsonb_build_object(
                        'goal_id',     v_goal.id,
                        'metric_key',  v_goal.metric_key,
                        'gap_pct',     v_gap_pct,
                        'current',     v_current,
                        'target',      v_goal.target_value,
                        'urgency',     v_urgency,
                        'days_left',   v_days_left
                    ),
                    jsonb_build_object(
                        'success_when', 'current_value >= target_value * 0.9'
                    )
                );
                v_tasks_created := v_tasks_created + 1;

                PERFORM public.write_signal(
                    'goal.correction_task_created',
                    'system',
                    v_goal.id,
                    'goal-evaluator',
                    jsonb_build_object(
                        'title',    v_goal.title,
                        'metric',   v_goal.metric_key,
                        'gap_pct',  v_gap_pct,
                        'urgency',  v_urgency
                    )
                );
            END IF;
        END IF;
    END LOOP;

    RETURN v_tasks_created;
END;
$$;

-- Add goal_correction + pm_recommendation to the task_type constraint
ALTER TABLE public.agent_tasks
  DROP CONSTRAINT IF EXISTS agent_tasks_task_type_check;
ALTER TABLE public.agent_tasks
  ADD CONSTRAINT agent_tasks_task_type_check
  CHECK (task_type IN ('primary', 'verification', 'remediation', 'goal_correction', 'pm_recommendation'));

-- ============================================================
-- PHASE 5: STRATEGY LEARNING — update_strategy_confidence()
-- Reads recent outcomes from signals table and updates
-- confidence scores in strategy_store.
-- Called weekly (Sunday 3 AM Thailand time).
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_strategy_confidence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sent    INTEGER;
    v_total_opened  INTEGER;
    v_open_rate     NUMERIC;
    v_best_hour     INTEGER;
    v_conv_by_cat   JSONB;
    v_trial_sent    INTEGER;
    v_trial_conv    INTEGER;
    v_conv_rate     NUMERIC;
BEGIN
    -- -------------------------------------------------------
    -- Strategy 1: email_send_window
    -- Look at invitation.sent signals and find hour with best
    -- correlation to invitation.opened signals (via track-invitation)
    -- -------------------------------------------------------
    SELECT COUNT(*) INTO v_total_sent
      FROM public.signals
     WHERE event_type = 'invitation.sent'
       AND created_at >= NOW() - INTERVAL '7 days';

    SELECT COUNT(*) INTO v_total_opened
      FROM public.signals
     WHERE event_type IN ('invitation.sent')  -- proxy: track open via track-invitation → invitation table
       AND created_at >= NOW() - INTERVAL '7 days';

    -- Find hour of day with most sends (as proxy for best window)
    SELECT EXTRACT(HOUR FROM created_at)::INTEGER INTO v_best_hour
      FROM public.signals
     WHERE event_type = 'invitation.sent'
       AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY 1
     ORDER BY COUNT(*) DESC
     LIMIT 1;

    IF v_total_sent > 5 THEN
        -- We have enough data — update confidence
        UPDATE public.strategy_store
           SET value = jsonb_set(
                   value,
                   '{best_hour_utc}',
                   to_jsonb(COALESCE(v_best_hour, (value->>'best_hour_utc')::INTEGER))
               ),
               confidence = LEAST(0.9, confidence + 0.05),
               notes = format('Updated from %s sends in last 7 days. Best send hour UTC: %s.', v_total_sent, v_best_hour)
         WHERE key = 'email_send_window';
    END IF;

    -- -------------------------------------------------------
    -- Strategy 2: lead_priority_categories
    -- Which categories have the best claim conversion rate?
    -- -------------------------------------------------------
    SELECT jsonb_object_agg(category, claim_count) INTO v_conv_by_cat
      FROM (
          SELECT sp.category, COUNT(*) AS claim_count
            FROM public.service_providers sp
           WHERE sp.verified = true
             AND sp.claimed_at >= NOW() - INTERVAL '30 days'
           GROUP BY sp.category
           ORDER BY claim_count DESC
      ) sub;

    IF v_conv_by_cat IS NOT NULL AND jsonb_typeof(v_conv_by_cat) = 'object' THEN
        UPDATE public.strategy_store
           SET value = jsonb_set(value, '{conversion_by_category}', v_conv_by_cat),
               confidence = LEAST(0.85, confidence + 0.05),
               notes = format('Updated from last-30d claim conversions: %s', v_conv_by_cat)
         WHERE key = 'lead_priority_categories';
    END IF;

    -- -------------------------------------------------------
    -- Strategy 3: outreach_sequence
    -- Check if trial reminders actually lead to trial conversion
    -- -------------------------------------------------------
    SELECT COUNT(*) INTO v_trial_sent
      FROM public.signals
     WHERE event_type IN ('subscription.trial_reminder_sent', 'subscription.trial_urgent_sent')
       AND created_at >= NOW() - INTERVAL '14 days';

    SELECT COUNT(*) INTO v_trial_conv
      FROM public.signals
     WHERE event_type = 'subscription.plan_purchased'
       AND created_at >= NOW() - INTERVAL '14 days';

    IF v_trial_sent > 0 THEN
        v_conv_rate := ROUND((v_trial_conv::NUMERIC / v_trial_sent::NUMERIC) * 100);
        UPDATE public.strategy_store
           SET value = jsonb_set(value, '{trial_conversion_rate_pct}', to_jsonb(v_conv_rate)),
               confidence = LEAST(0.85, confidence + 0.05),
               notes = format('Trial→Paid conversion: %s%% (%s sent, %s converted in 14d)', v_conv_rate, v_trial_sent, v_trial_conv)
         WHERE key = 'outreach_sequence';
    END IF;

    -- Signal that learning cycle completed
    PERFORM public.write_signal(
        'strategy.learning_cycle_completed',
        'system',
        NULL,
        'strategy-learner',
        jsonb_build_object(
            'total_invitation_sends_7d', v_total_sent,
            'best_send_hour_utc',        v_best_hour,
            'trial_sends_14d',           v_trial_sent,
            'trial_conversions_14d',     v_trial_conv
        )
    );
END;
$$;

-- ============================================================
-- PG_CRON JOBS (only works if pg_cron extension is enabled)
-- ============================================================

-- Run KPI snapshot daily at 00:05 Thailand time (17:05 UTC)
SELECT cron.schedule(
    'kpi-daily-snapshot',
    '5 17 * * *',
    $$SELECT public.update_daily_kpi_snapshot();$$
) WHERE NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'kpi-daily-snapshot'
);

-- Evaluate goals daily at 00:10 Thailand time (17:10 UTC)
SELECT cron.schedule(
    'goal-daily-evaluation',
    '10 17 * * *',
    $$SELECT public.evaluate_goals_and_create_tasks();$$
) WHERE NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'goal-daily-evaluation'
);

-- Strategy learning weekly on Sunday at 03:00 Thailand time (20:00 UTC Saturday)
SELECT cron.schedule(
    'strategy-weekly-learning',
    '0 20 * * 6',
    $$SELECT public.update_strategy_confidence();$$
) WHERE NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'strategy-weekly-learning'
);

-- ============================================================
-- SUPPORT AGENT: extend inbound_emails for AI processing
-- ============================================================
ALTER TABLE public.inbound_emails
  ADD COLUMN IF NOT EXISTS processed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_notes TEXT;

-- Ensure processed_status has a consistent default
ALTER TABLE public.inbound_emails
  ALTER COLUMN processed_status SET DEFAULT 'unread';
