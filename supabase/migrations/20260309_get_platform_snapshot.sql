-- ================================================================
-- get_platform_snapshot() — The Brain's Eyes
-- ================================================================
-- Returns a complete picture of the platform state in one call.
-- This is exactly what a human sees when they open the admin panel.
--
-- Called by cron-worker at the start of every 15-minute cycle.
-- Called by autonomous-brain before every decision.
-- Can also be polled by the admin dashboard for live state.
--
-- Returns JSONB so the caller (Deno/JS) can parse freely.
-- All blocks are wrapped in exception handlers so a missing
-- table never crashes the snapshot — it returns 0 instead.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_platform_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- runs with owner privileges even from anon context
SET search_path = public
AS $$
DECLARE
    v_snapshot JSONB;

    -- Providers
    v_total_providers       INT := 0;
    v_claimed_providers     INT := 0;
    v_unclaimed_providers   INT := 0;
    v_new_providers_24h     INT := 0;
    v_new_providers_7d      INT := 0;

    -- Users
    v_total_users           INT := 0;
    v_new_users_24h         INT := 0;
    v_new_users_7d          INT := 0;

    -- Bookings
    v_bookings_pending      INT := 0;
    v_bookings_confirmed    INT := 0;
    v_bookings_7d           INT := 0;
    v_revenue_7d_thb        NUMERIC := 0;
    v_revenue_30d_thb       NUMERIC := 0;

    -- Invitations / outreach pipeline
    v_invites_sent_total    INT := 0;
    v_invites_sent_7d       INT := 0;
    v_invites_opened        INT := 0;
    v_invites_clicked       INT := 0;
    v_invites_converted     INT := 0;
    v_leads_no_email        INT := 0;  -- providers with no email, not yet contacted

    -- Claims
    v_claims_pending        INT := 0;

    -- Subscriptions / revenue
    v_active_subscriptions  INT := 0;
    v_mrr_thb               NUMERIC := 0;

    -- Signals (unprocessed = brain hasn't seen yet)
    v_signals_unread        INT := 0;
    v_signals_critical      INT := 0;  -- subscription.cancelled or payment failures

    -- Agent health (last action)
    v_last_brain_action     TEXT := 'never';
    v_last_brain_at         TEXT := null;
    v_brain_actions_24h     INT := 0;

    -- Goals progress
    v_goals                 JSONB := '[]'::JSONB;

    -- Alerts (things that need human or brain attention)
    v_alerts                JSONB := '[]'::JSONB;

BEGIN

    -- ----------------------------------------------------------------
    -- PROVIDERS
    -- ----------------------------------------------------------------
    BEGIN
        SELECT
            COUNT(*)                                           INTO v_total_providers
        FROM public.service_providers WHERE status = 'active';

        SELECT
            COUNT(*) FILTER (WHERE claimed = true)            INTO v_claimed_providers
        FROM public.service_providers WHERE status = 'active';

        v_unclaimed_providers := v_total_providers - v_claimed_providers;

        SELECT COUNT(*) INTO v_new_providers_24h
        FROM public.service_providers
        WHERE created_at > NOW() - INTERVAL '24 hours';

        SELECT COUNT(*) INTO v_new_providers_7d
        FROM public.service_providers
        WHERE created_at > NOW() - INTERVAL '7 days';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- USERS
    -- ----------------------------------------------------------------
    BEGIN
        SELECT COUNT(*) INTO v_total_users FROM public.users;

        SELECT COUNT(*) INTO v_new_users_24h
        FROM public.users
        WHERE created_at > NOW() - INTERVAL '24 hours';

        SELECT COUNT(*) INTO v_new_users_7d
        FROM public.users
        WHERE created_at > NOW() - INTERVAL '7 days';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- BOOKINGS & REVENUE
    -- ----------------------------------------------------------------
    BEGIN
        SELECT
            COUNT(*) FILTER (WHERE status = 'pending'),
            COUNT(*) FILTER (WHERE status = 'confirmed')
        INTO v_bookings_pending, v_bookings_confirmed
        FROM public.bookings;

        SELECT COUNT(*) INTO v_bookings_7d
        FROM public.bookings
        WHERE created_at > NOW() - INTERVAL '7 days';

        SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue_7d_thb
        FROM public.bookings
        WHERE status = 'completed'
          AND created_at > NOW() - INTERVAL '7 days';

        SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue_30d_thb
        FROM public.bookings
        WHERE status = 'completed'
          AND created_at > NOW() - INTERVAL '30 days';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- INVITATIONS / OUTREACH PIPELINE
    -- ----------------------------------------------------------------
    BEGIN
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
            COUNT(*) FILTER (WHERE status = 'opened' OR (metadata->>'opened_at') IS NOT NULL),
            COUNT(*) FILTER (WHERE status = 'clicked' OR (metadata->>'clicked_at') IS NOT NULL),
            COUNT(*) FILTER (WHERE status = 'converted')
        INTO
            v_invites_sent_total,
            v_invites_sent_7d,
            v_invites_opened,
            v_invites_clicked,
            v_invites_converted
        FROM public.invitations;

        -- Leads with no email that have never been contacted
        SELECT COUNT(*) INTO v_leads_no_email
        FROM public.service_providers sp
        WHERE sp.verified = false
          AND sp.status = 'active'
          AND (sp.email IS NULL OR sp.email = '')
          AND NOT EXISTS (
              SELECT 1 FROM public.invitations i
              WHERE i.service_provider_id = sp.id
          );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- CLAIMS PENDING REVIEW
    -- ----------------------------------------------------------------
    BEGIN
        SELECT COUNT(*) INTO v_claims_pending
        FROM public.service_providers
        WHERE claimed = true
          AND (stripe_status IS NULL OR stripe_status = 'pending');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- SUBSCRIPTIONS / MRR
    -- ----------------------------------------------------------------
    BEGIN
        -- Count providers on a paid plan
        SELECT COUNT(*) INTO v_active_subscriptions
        FROM public.service_providers
        WHERE verified = true
          AND stripe_status = 'paid'
          AND status = 'active';

        -- Estimate MRR from plan metadata (35 THB basic / 1500 THB pro)
        SELECT COALESCE(SUM(
            CASE
                WHEN metadata->>'current_plan' = 'pro'   THEN 1500
                WHEN metadata->>'current_plan' = 'basic' THEN 35
                ELSE 0
            END
        ), 0) INTO v_mrr_thb
        FROM public.service_providers
        WHERE verified = true AND stripe_status = 'paid';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- SIGNALS (unprocessed)
    -- ----------------------------------------------------------------
    BEGIN
        SELECT COUNT(*) INTO v_signals_unread
        FROM public.signals
        WHERE processed = false;

        SELECT COUNT(*) INTO v_signals_critical
        FROM public.signals
        WHERE processed = false
          AND event_type IN (
              'subscription.cancelled',
              'subscription.cancellation_requested',
              'invitation.send_failed',
              'booking.payment_failed'
          );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- AGENT / BRAIN HEALTH
    -- ----------------------------------------------------------------
    BEGIN
        SELECT
            action->>'action',
            created_at::TEXT
        INTO v_last_brain_action, v_last_brain_at
        FROM public.agent_decisions
        WHERE agent_id = 'cron-worker'
        ORDER BY created_at DESC
        LIMIT 1;

        SELECT COUNT(*) INTO v_brain_actions_24h
        FROM public.agent_decisions
        WHERE agent_id = 'cron-worker'
          AND created_at > NOW() - INTERVAL '24 hours';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- COMPANY GOALS PROGRESS
    -- ----------------------------------------------------------------
    BEGIN
        SELECT jsonb_agg(
            jsonb_build_object(
                'title',         title,
                'metric',        metric_key,
                'target',        target_value,
                'current',       current_value,
                'pct',           ROUND((current_value / NULLIF(target_value, 0)) * 100),
                'status',        status,
                'deadline',      deadline::TEXT
            ) ORDER BY priority
        ) INTO v_goals
        FROM public.company_goals
        WHERE status = 'active';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- ALERTS — things that need attention right now
    -- ----------------------------------------------------------------
    BEGIN
        DECLARE v_alert_rows JSONB := '[]'::JSONB;
        BEGIN
            -- Recent churn signals
            SELECT jsonb_agg(jsonb_build_object(
                'type', 'CHURN',
                'message', 'Subscription cancelled',
                'data', data,
                'at', created_at::TEXT
            ))
            INTO v_alert_rows
            FROM public.signals
            WHERE event_type = 'subscription.cancelled'
              AND created_at > NOW() - INTERVAL '24 hours'
              AND processed = false;

            IF v_alert_rows IS NOT NULL THEN
                v_alerts := v_alerts || v_alert_rows;
            END IF;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
            -- Failed invitations (outreach broken)
            DECLARE v_failed_invites INT := 0;
            BEGIN
                SELECT COUNT(*) INTO v_failed_invites
                FROM public.invitations
                WHERE status = 'failed'
                  AND created_at > NOW() - INTERVAL '24 hours';

                IF v_failed_invites > 0 THEN
                    v_alerts := v_alerts || jsonb_build_array(
                        jsonb_build_object(
                            'type', 'OUTREACH_FAILURE',
                            'message', v_failed_invites || ' invitations failed in last 24h',
                            'count', v_failed_invites
                        )
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
        END;

        BEGIN
            -- Uncontacted leads stale > 72h
            DECLARE v_stale INT := 0;
            BEGIN
                SELECT COUNT(*) INTO v_stale
                FROM public.service_providers sp
                WHERE sp.verified = false
                  AND sp.status = 'active'
                  AND sp.created_at < NOW() - INTERVAL '72 hours'
                  AND NOT EXISTS (
                      SELECT 1 FROM public.invitations i
                      WHERE i.service_provider_id = sp.id
                  );

                IF v_stale > 5 THEN
                    v_alerts := v_alerts || jsonb_build_array(
                        jsonb_build_object(
                            'type', 'STALE_LEADS',
                            'message', v_stale || ' unclaimed businesses never contacted (>72h)',
                            'count', v_stale,
                            'priority', 70
                        )
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
        END;

        -- MRR sanity check
        IF v_mrr_thb = 0 AND v_claimed_providers > 5 THEN
            v_alerts := v_alerts || jsonb_build_array(
                jsonb_build_object(
                    'type', 'ZERO_MRR',
                    'message', 'MRR is 0 despite ' || v_claimed_providers || ' claimed providers — check Stripe',
                    'priority', 80
                )
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ----------------------------------------------------------------
    -- ASSEMBLE FINAL SNAPSHOT
    -- ----------------------------------------------------------------
    v_snapshot := jsonb_build_object(

        'snapshot_at', NOW()::TEXT,
        'snapshot_version', 1,

        -- Platform health scores
        'health', jsonb_build_object(
            'mrr_thb',              v_mrr_thb,
            'active_subscriptions', v_active_subscriptions,
            'revenue_7d_thb',       v_revenue_7d_thb,
            'revenue_30d_thb',      v_revenue_30d_thb,
            'claimed_providers',    v_claimed_providers,
            'claim_rate_pct',       CASE WHEN v_total_providers > 0
                                         THEN ROUND((v_claimed_providers::NUMERIC / v_total_providers) * 100, 1)
                                         ELSE 0 END
        ),

        -- Growth signals
        'growth', jsonb_build_object(
            'total_providers',      v_total_providers,
            'unclaimed_providers',  v_unclaimed_providers,
            'new_providers_24h',    v_new_providers_24h,
            'new_providers_7d',     v_new_providers_7d,
            'total_users',          v_total_users,
            'new_users_24h',        v_new_users_24h,
            'new_users_7d',         v_new_users_7d
        ),

        -- Operational pipeline
        'pipeline', jsonb_build_object(
            'bookings_pending',     v_bookings_pending,
            'bookings_confirmed',   v_bookings_confirmed,
            'bookings_7d',          v_bookings_7d,
            'claims_pending',       v_claims_pending,
            'invites_sent_total',   v_invites_sent_total,
            'invites_sent_7d',      v_invites_sent_7d,
            'invites_opened',       v_invites_opened,
            'invites_clicked',      v_invites_clicked,
            'invites_converted',    v_invites_converted,
            'open_rate_pct',        CASE WHEN v_invites_sent_total > 0
                                         THEN ROUND((v_invites_opened::NUMERIC / v_invites_sent_total) * 100, 1)
                                         ELSE 0 END,
            'conversion_rate_pct',  CASE WHEN v_invites_sent_total > 0
                                         THEN ROUND((v_invites_converted::NUMERIC / v_invites_sent_total) * 100, 1)
                                         ELSE 0 END,
            'leads_no_email',       v_leads_no_email
        ),

        -- Brain / agent state
        'brain', jsonb_build_object(
            'signals_unread',       v_signals_unread,
            'signals_critical',     v_signals_critical,
            'last_action',          COALESCE(v_last_brain_action, 'never'),
            'last_action_at',       v_last_brain_at,
            'actions_24h',          v_brain_actions_24h
        ),

        -- Goal progress
        'goals', COALESCE(v_goals, '[]'::JSONB),

        -- Alerts (sorted by implicit priority in order added)
        'alerts', v_alerts,
        'alert_count', jsonb_array_length(v_alerts)
    );

    RETURN v_snapshot;

EXCEPTION WHEN OTHERS THEN
    -- Never crash — return minimal safe snapshot
    RETURN jsonb_build_object(
        'snapshot_at', NOW()::TEXT,
        'error', SQLERRM,
        'health', '{}',
        'alerts', '[]',
        'alert_count', 0
    );
END;
$$;

-- Grant execute to service role and authenticated users (for admin dashboard)
GRANT EXECUTE ON FUNCTION public.get_platform_snapshot() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_snapshot() TO authenticated;

-- ================================================================
-- Quick test — run this in SQL Editor to verify:
-- SELECT get_platform_snapshot();
-- ================================================================
