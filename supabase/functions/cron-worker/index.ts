// @ts-nocheck
/**
 * 🤖 CRON WORKER — THE AUTONOMOUS BRAIN
 *
 * Runs every 15 minutes via pg_cron.
 * Uses get_platform_snapshot() to SEE the platform state
 * before making any decision — exactly like a human admin would.
 *
 * Cycle: Observe → Reason → Act → Verify → Escalate → Log
 *
 * New in this version:
 *  - Phase 2: KPI threshold breach detection
 *  - Phase 3: Goal-correction task execution
 *  - Phase 4: Verification tasks after actions + escalation on repeated failures
 *  - Phase 5: strategy_store consulted before REASON phase
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🤖 Autonomous Brain starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();
    const cycleId = crypto.randomUUID();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // ================================================================
        // STEP 1: OBSERVE — read the full platform state in one call
        // ================================================================
        console.log(`[${cycleId}] 👁 Observing platform state...`);

        const { data: snapshotData, error: snapshotError } = await supabase
            .rpc('get_platform_snapshot');

        if (snapshotError) {
            throw new Error(`Snapshot failed: ${snapshotError.message}`);
        }

        const snapshot = snapshotData as {
            snapshot_at: string;
            health: {
                mrr_thb: number;
                active_subscriptions: number;
                revenue_7d_thb: number;
                claimed_providers: number;
                claim_rate_pct: number;
            };
            growth: {
                total_providers: number;
                unclaimed_providers: number;
                new_providers_24h: number;
                new_users_24h: number;
            };
            pipeline: {
                bookings_pending: number;
                claims_pending: number;
                invites_sent_7d: number;
                invites_converted: number;
                conversion_rate_pct: number;
                leads_no_email: number;
            };
            brain: {
                signals_unread: number;
                signals_critical: number;
                last_action: string;
                actions_24h: number;
            };
            goals: Array<{ title: string; pct: number; metric: string; current: number; target: number }>;
            alerts: Array<{ type: string; message: string; priority?: number; count?: number }>;
            alert_count: number;
        };

        console.log(`[${cycleId}] 📊 Snapshot: MRR=${snapshot.health.mrr_thb}฿ | Claimed=${snapshot.health.claimed_providers} | Unread signals=${snapshot.brain.signals_unread} | Alerts=${snapshot.alert_count}`);

        // Write snapshot itself as a signal
        await supabase.rpc('write_signal', {
            p_event_type: 'brain.snapshot',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'cron-worker',
            p_data: {
                cycle_id: cycleId,
                health_summary: snapshot.health,
                alert_count: snapshot.alert_count,
                signals_unread: snapshot.brain.signals_unread
            }
        });

        // ================================================================
        // STEP 1.5 (Phase 5): Read strategy_store to inform decisions
        // ================================================================
        const { data: strategies } = await supabase
            .from('strategy_store')
            .select('key, value, confidence')
            .in('key', ['email_send_window', 'lead_priority_categories', 'platform_health_targets', 'churn_risk_signals']);

        const strategyMap: Record<string, { value: any; confidence: number }> = {};
        for (const s of strategies ?? []) {
            strategyMap[s.key] = { value: s.value, confidence: s.confidence };
        }

        // Phase 5: Derive behaviors from strategy_store (only apply when confidence > 0.7)
        const emailStrategy = strategyMap['email_send_window'];
        const leadStrategy  = strategyMap['lead_priority_categories'];
        const healthTargets = strategyMap['platform_health_targets'];
        const churnStrategy = strategyMap['churn_risk_signals'];

        // 1. Outreach window: respect best send hour only when Brain has learned it (confidence > 0.7)
        const currentHourUtc = new Date().getUTCHours();
        const bestHourUtc = emailStrategy?.value?.best_hour_utc ?? 2;
        const outreachWindowOpen = emailStrategy && emailStrategy.confidence > 0.7
            ? Math.abs(currentHourUtc - bestHourUtc) <= 2
            : true;

        // 2. Lead priority categories: pass to sales-scout payload when confident
        const leadPriorityCategories = leadStrategy && leadStrategy.confidence > 0.7
            ? leadStrategy.value?.priority_order ?? []
            : [];
        const leadMinRating = leadStrategy && leadStrategy.confidence > 0.7
            ? leadStrategy.value?.min_rating ?? 0
            : 0;

        // 3. Health targets: boost claim/outreach priority when below targets
        const claimBoosted = healthTargets && healthTargets.confidence > 0.6
            ? (snapshot.health.claimed_providers / Math.max(snapshot.health.total_providers, 1)) < (healthTargets.value?.target_claim_rate ?? 0.15)
            : false;

        // 4. Churn thresholds: tune retention triggers
        const churnNoLoginDays = churnStrategy?.value?.no_login_days ?? 14;

        console.log(`[${cycleId}] 📚 Strategies loaded: ${Object.keys(strategyMap).length} | outreach_window=${outreachWindowOpen} | lead_cats=${leadPriorityCategories.length} | claim_boosted=${claimBoosted}`);

        // ================================================================
        // STEP 1.6 (Phase 2): Check KPI breaches
        // ================================================================
        const { data: kpiBreadches } = await supabase.rpc('get_kpi_breaches');
        const criticalKpi = (kpiBreadches ?? []).filter((b: any) => b.severity === 'critical');
        const warningKpi  = (kpiBreadches ?? []).filter((b: any) => b.severity === 'warning');

        if (criticalKpi.length > 0) {
            console.log(`[${cycleId}] 🚨 KPI Critical breaches: ${criticalKpi.map((b: any) => b.metric_name).join(', ')}`);
        }

        // ================================================================
        // STEP 1.7 (Phase 4): Check for open escalations — don't flood them
        // ================================================================
        const { data: openEscalations } = await supabase
            .from('escalations')
            .select('id, reason, agent_id, retry_count')
            .eq('status', 'open')
            .limit(10);

        const hasOpenEscalations = (openEscalations ?? []).length > 0;
        if (hasOpenEscalations) {
            console.log(`[${cycleId}] ⚠️ Open escalations: ${openEscalations!.length} — will not create new ones for same agents`);
        }

        // Track recent failure counts per function (for escalation detection)
        const { data: recentFailures } = await supabase
            .from('signals')
            .select('data')
            .eq('event_type', 'brain.action_failed')
            .gte('created_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()) // last 3h
            .limit(50);

        const failureCountByFn: Record<string, number> = {};
        for (const f of recentFailures ?? []) {
            const fn = f.data?.fn;
            if (fn) failureCountByFn[fn] = (failureCountByFn[fn] ?? 0) + 1;
        }

        // ================================================================
        // STEP 2: REASON — decide what actions to take
        // ================================================================
        console.log(`[${cycleId}] 🧠 Reasoning...`);

        const actionsToTake: Array<{
            type: string;
            priority: number;
            reason: string;
            fn: string;
            payload: object;
        }> = [];

        // --- CRITICAL: Unprocessed critical signals ---
        if (snapshot.brain.signals_critical > 0) {
            actionsToTake.push({
                type: 'PROCESS_CRITICAL_SIGNALS',
                priority: 100,
                reason: `${snapshot.brain.signals_critical} critical unprocessed signals`,
                fn: 'retention-agent',
                payload: { action: 'PROCESS_STALE_LEADS' }
            });
        }

        // --- Phase 2: KPI Critical breaches ---
        for (const breach of criticalKpi) {
            if (breach.metric_name === 'bookings_today') {
                actionsToTake.push({
                    type: 'KPI_BOOKINGS_CRITICAL',
                    priority: 90,
                    reason: `Bookings today (${breach.current_value}) below critical threshold (${breach.critical_threshold})`,
                    fn: 'retention-agent',
                    payload: { action: 'SEND_TRIAL_REMINDERS' }
                });
            }
            if (breach.metric_name === 'leads_today') {
                actionsToTake.push({
                    type: 'KPI_LEADS_CRITICAL',
                    priority: 85,
                    reason: `New leads today (${breach.current_value}) below critical threshold (${breach.critical_threshold})`,
                    fn: 'sales-scout',
                    payload: { action: 'invite_leads', priority_categories: leadPriorityCategories, min_rating: leadMinRating }
                });
            }
            if (breach.metric_name === 'verified_businesses') {
                actionsToTake.push({
                    type: 'KPI_VERIFIED_CRITICAL',
                    priority: 80,
                    reason: `Verified businesses (${breach.current_value}) below critical threshold (${breach.critical_threshold})`,
                    fn: 'sales-outreach',
                    payload: { action: 'PROCESS_FOLLOWUPS' }
                });
            }
        }

        // --- Phase 2: KPI Warning breaches (lower priority) ---
        for (const breach of warningKpi) {
            if (breach.metric_name === 'leads_today' && outreachWindowOpen) {
                actionsToTake.push({
                    type: 'KPI_LEADS_WARNING',
                    priority: 60,
                    reason: `Leads today (${breach.current_value}) at warning level (threshold: ${breach.warning_threshold})`,
                    fn: 'sales-scout',
                    payload: { action: 'invite_leads' }
                });
            }
        }

        // --- HIGH: Explicit snapshot alerts ---
        for (const alert of snapshot.alerts) {
            if (alert.type === 'CHURN') {
                actionsToTake.push({
                    type: 'RETENTION_CHURN_RESPONSE',
                    priority: 95,
                    reason: alert.message,
                    fn: 'retention-agent',
                    payload: { action: 'FULL_RUN' }
                });
            }
            if (alert.type === 'ZERO_MRR') {
                actionsToTake.push({
                    type: 'PAYMENT_CHECK',
                    priority: 85,
                    reason: alert.message,
                    fn: 'payment-recovery',
                    payload: { action: 'PROCESS_SCHEDULED' }
                });
            }
            if (alert.type === 'OUTREACH_FAILURE') {
                actionsToTake.push({
                    type: 'OUTREACH_RETRY',
                    priority: 75,
                    reason: alert.message,
                    fn: 'sales-outreach',
                    payload: { action: 'PROCESS_FOLLOWUPS' }
                });
            }
        }

        // --- MEDIUM: Claims pending (priority boosted by strategy if below target_claim_rate) ---
        if (snapshot.pipeline.claims_pending > 0) {
            actionsToTake.push({
                type: 'PROCESS_PENDING_CLAIMS',
                priority: claimBoosted ? 88 : 80,
                reason: `${snapshot.pipeline.claims_pending} claims waiting for verification${claimBoosted ? ' (claim rate below target — boosted)' : ''}`,
                fn: 'admin-actions',
                payload: { action: 'REVIEW_PENDING_CLAIMS' }
            });
        }

        // --- MEDIUM: Stale leads (enriched with lead strategy if confident) ---
        if (snapshot.alerts.find(a => a.type === 'STALE_LEADS')) {
            actionsToTake.push({
                type: 'OUTREACH_STALE_LEADS',
                priority: 70,
                reason: 'Stale leads need outreach',
                fn: 'sales-scout',
                payload: { action: 'invite_leads', priority_categories: leadPriorityCategories, min_rating: leadMinRating }
            });
        }

        // --- Phase 3: Goal-correction tasks pending ---
        const { data: goalTasks } = await supabase
            .from('agent_tasks')
            .select('id, title, priority, context')
            .eq('task_type', 'goal_correction')
            .eq('status', 'pending')
            .order('priority', { ascending: true })
            .limit(3);

        for (const task of goalTasks ?? []) {
            const metricKey = task.context?.metric_key;
            const urgency   = task.context?.urgency;
            const fnMap: Record<string, string> = {
                claimed_providers:   'sales-scout',
                monthly_revenue_thb: 'payment-recovery',
                active_users:        'retention-agent',
                avg_provider_rating: 'retention-agent'
            };
            const targetFn = fnMap[metricKey] ?? 'sales-scout';

            actionsToTake.push({
                type: `GOAL_CORRECTION_${metricKey?.toUpperCase()}`,
                priority: urgency === 'critical' ? 88 : urgency === 'high' ? 72 : 55,
                reason: task.title,
                fn: targetFn,
                payload: { action: 'invite_leads', _goal_task_id: task.id }
            });

            // Mark as in_progress so we don't queue it again
            await supabase
                .from('agent_tasks')
                .update({ status: 'in_progress' })
                .eq('id', task.id);
        }

        // ── SYNERGY LOOP 1: PM Recommendations → Actual Agent Calls ──────────────
        // PM agent writes pm_recommendation tasks every Sunday.
        // Brain reads them and maps each to the right agent call.
        const { data: pmTasks } = await supabase
            .from('agent_tasks')
            .select('id, title, description, input_context')
            .eq('task_type', 'pm_recommendation')
            .eq('status', 'pending')
            .order('input_context->rank', { ascending: true })
            .limit(3);

        const PM_METRIC_TO_AGENT: Record<string, { fn: string; payload: object }> = {
            mrr:               { fn: 'retention-agent', payload: { action: 'SEND_TRIAL_REMINDERS' } },
            claimed_providers: { fn: 'sales-scout',     payload: { action: 'invite_leads' } },
            bookings:          { fn: 'retention-agent', payload: { action: 'SEND_TRIAL_REMINDERS' } },
            active_users:      { fn: 'retention-agent', payload: { action: 'FULL_RUN' } },
            retention:         { fn: 'retention-agent', payload: { action: 'FULL_RUN' } },
        };

        for (const task of pmTasks ?? []) {
            const impact = task.input_context?.metric_impact ?? '';
            const mapped = PM_METRIC_TO_AGENT[impact] ?? PM_METRIC_TO_AGENT['claimed_providers'];
            actionsToTake.push({
                type: `PM_REC_EXECUTE_${impact.toUpperCase()}`,
                priority: task.input_context?.rank === 1 ? 82 : task.input_context?.rank === 2 ? 68 : 55,
                reason: `PM recommendation: ${task.title}`,
                fn: mapped.fn,
                payload: { ...mapped.payload, _pm_task_id: task.id },
            });
            await supabase.from('agent_tasks').update({ status: 'in_progress' }).eq('id', task.id);
        }

        // ── SYNERGY LOOP 2: Onboarding Follow-up Chain ────────────────────────
        // If a business was onboarded 24–48h ago but hasn't had any activity signal
        // (no login, no booking, no profile edit) → retention-agent sends a check-in.
        const onboardedWindow = {
            from: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            to:   new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        };
        const { data: recentOnboardings } = await supabase
            .from('signals')
            .select('entity_id, data, created_at')
            .eq('event_type', 'onboarding.welcome_sent')
            .gte('created_at', onboardedWindow.from)
            .lte('created_at', onboardedWindow.to)
            .limit(5);

        const followUpNeeded: string[] = [];
        for (const ob of recentOnboardings ?? []) {
            // Check if this provider has any signal after their onboarding
            const { count: activityCount } = await supabase
                .from('signals')
                .select('id', { count: 'exact', head: true })
                .eq('entity_id', ob.entity_id)
                .in('event_type', ['profile.updated', 'booking.received', 'provider.login', 'support.reply_sent'])
                .gt('created_at', ob.created_at);

            if ((activityCount ?? 0) === 0) followUpNeeded.push(ob.entity_id);
        }

        if (followUpNeeded.length > 0) {
            actionsToTake.push({
                type: 'ONBOARDING_FOLLOWUP_CHECKIN',
                priority: 78,
                reason: `${followUpNeeded.length} businesses onboarded 24–48h ago with zero activity — sending check-in`,
                fn: 'retention-agent',
                payload: { action: 'SEND_TRIAL_REMINDERS', provider_ids: followUpNeeded, context: 'onboarding_followup' },
            });
        }

        // ── SYNERGY LOOP 3: Hot Lead Detector (Sales → Support cross-awareness) ──
        // If a lead was contacted by sales-scout AND then sent an inbound email
        // within 72h → they're hot → escalate to priority outreach.
        const { data: recentContacts } = await supabase
            .from('signals')
            .select('entity_id, data, created_at')
            .eq('event_type', 'outreach.email_sent')
            .gte('created_at', new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
            .limit(20);

        const hotLeads: string[] = [];
        for (const contact of recentContacts ?? []) {
            const contactedEmail = contact.data?.to ?? contact.data?.email;
            if (!contactedEmail) continue;
            // Check if they replied inbound after being contacted
            const { count: replyCount } = await supabase
                .from('inbound_emails')
                .select('id', { count: 'exact', head: true })
                .ilike('sender', `%${contactedEmail.split('@')[1] ?? ''}%`)
                .gt('created_at', contact.created_at);

            if ((replyCount ?? 0) > 0 && contact.entity_id) {
                hotLeads.push(contact.entity_id);
            }
        }

        if (hotLeads.length > 0) {
            actionsToTake.push({
                type: 'HOT_LEAD_PRIORITY_OUTREACH',
                priority: 92,
                reason: `${hotLeads.length} leads contacted by sales replied inbound — HOT leads detected`,
                fn: 'sales-scout',
                payload: { action: 'invite_leads', provider_ids: hotLeads, context: 'hot_lead', priority_boost: true },
            });
        }

        // --- CRITICAL: New business claimed profile → send onboarding email ---
        const { data: pendingOnboardings } = await supabase
            .from('signals')
            .select('entity_id, data')
            .eq('event_type', 'claim.payment_completed')
            .eq('processed', false)
            .limit(5);

        for (const ob of pendingOnboardings ?? []) {
            actionsToTake.push({
                type: 'ONBOARD_NEW_BUSINESS',
                priority: 95,
                reason: `New business claimed and paid: provider=${ob.entity_id}`,
                fn: 'onboarding-agent',
                payload: { provider_id: ob.entity_id, user_id: ob.data?.user_id }
            });
        }

        // --- MEDIUM: Unread inbound emails → AI support response ---
        const { count: unreadEmailCount } = await supabase
            .from('inbound_emails')
            .select('id', { count: 'exact', head: true })
            .eq('processed_status', 'unread');

        if ((unreadEmailCount ?? 0) > 0) {
            actionsToTake.push({
                type: 'SUPPORT_AUTO_REPLY',
                priority: 75,
                reason: `${unreadEmailCount} unread inbound emails awaiting AI support response`,
                fn: 'support-agent',
                payload: { action: 'PROCESS_UNREAD' }
            });
        }

        // --- LOW: Regular outreach (respects strategy send window) ---
        if (snapshot.pipeline.invites_sent_7d < 10 && snapshot.growth.unclaimed_providers > 20 && outreachWindowOpen) {
            actionsToTake.push({
                type: 'ROUTINE_OUTREACH',
                priority: 30,
                reason: `Only ${snapshot.pipeline.invites_sent_7d} invites sent this week, ${snapshot.growth.unclaimed_providers} unclaimed providers`,
                fn: 'sales-scout',
                payload: { action: 'invite_leads' }
            });
        }

        // --- LOW: Trial reminders (if brain was dormant) ---
        if (snapshot.brain.actions_24h === 0) {
            actionsToTake.push({
                type: 'RETENTION_CHECK',
                priority: 50,
                reason: 'Brain was dormant — running retention check',
                fn: 'retention-agent',
                payload: { action: 'SEND_TRIAL_REMINDERS' }
            });
        }

        // --- WEEKLY: PM agent runs every Sunday at 08:00 UTC ---
        const nowUtc = new Date();
        const dayOfWeek   = nowUtc.getUTCDay(); // 0 = Sunday
        const hourOfDay   = nowUtc.getUTCHours();
        if (dayOfWeek === 0 && hourOfDay === 8) {
            actionsToTake.push({
                type: 'PM_WEEKLY_ANALYSIS',
                priority: 45,
                reason: 'Sunday 08:00 UTC — weekly PM agent analysis of signals/KPIs',
                fn: 'pm-agent',
                payload: { action: 'WEEKLY_ANALYSIS' }
            });
        }

        // Sort by priority descending
        actionsToTake.sort((a, b) => b.priority - a.priority);

        console.log(`[${cycleId}] 📋 Actions queued: ${actionsToTake.length}`, actionsToTake.map(a => `${a.type}(${a.priority})`).join(', '));

        // ================================================================
        // STEP 3: ACT — execute top actions (max 3 per cycle)
        // ================================================================
        console.log(`[${cycleId}] ⚡ Acting...`);

        const executionResults: Array<{
            type: string;
            fn: string;
            success: boolean;
            result?: object;
            error?: string;
            duration_ms: number;
        }> = [];

        const MAX_ACTIONS_PER_CYCLE = 3;
        const actionsToExecute = actionsToTake.slice(0, MAX_ACTIONS_PER_CYCLE);

        for (const action of actionsToExecute) {
            const actionStart = Date.now();
            console.log(`[${cycleId}]   → Executing ${action.type} via ${action.fn}...`);

            try {
                const response = await fetch(`${supabaseUrl}/functions/v1/${action.fn}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify(action.payload)
                });

                const result = await response.json().catch(() => ({ status: response.status }));
                const success = response.ok;

                executionResults.push({
                    type: action.type,
                    fn: action.fn,
                    success,
                    result,
                    duration_ms: Date.now() - actionStart
                });

                await supabase.rpc('write_signal', {
                    p_event_type: success ? 'brain.action_taken' : 'brain.action_failed',
                    p_entity_type: 'system',
                    p_entity_id: null,
                    p_source: 'cron-worker',
                    p_data: {
                        cycle_id: cycleId,
                        action_type: action.type,
                        reason: action.reason,
                        fn: action.fn,
                        success,
                        duration_ms: Date.now() - actionStart,
                        ...(success ? {} : { status_code: response.status, error_body: result })
                    }
                });

                // Phase 4: Create verification task after successful action
                if (success) {
                    await supabase.from('agent_tasks').insert({
                        title: `Verify: ${action.type}`,
                        description: `Verify that ${action.fn} completed successfully. Reason: ${action.reason}`,
                        status: 'pending',
                        task_type: 'verification',
                        priority: 5,
                        context: {
                            cycle_id:     cycleId,
                            action_type:  action.type,
                            fn:           action.fn,
                            verify_after: new Date(Date.now() + 60 * 60 * 1000).toISOString()  // 1h from now
                        },
                        success_criteria: {
                            check:          'signal_received',
                            source:         action.fn,
                            created_after:  new Date(actionStart).toISOString()
                        }
                    });
                }

                console.log(`[${cycleId}]   ${success ? '✅' : '❌'} ${action.type}`);

            } catch (execError: any) {
                executionResults.push({
                    type: action.type,
                    fn: action.fn,
                    success: false,
                    error: execError.message,
                    duration_ms: Date.now() - actionStart
                });
                console.error(`[${cycleId}]   ❌ ${action.type}: ${execError.message}`);
                await supabase.rpc('write_signal', {
                    p_event_type: 'brain.action_failed',
                    p_entity_type: 'system',
                    p_entity_id: null,
                    p_source: 'cron-worker',
                    p_data: {
                        cycle_id: cycleId,
                        action_type: action.type,
                        fn: action.fn,
                        success: false,
                        error: execError.message,
                        duration_ms: Date.now() - actionStart
                    }
                }).catch(() => {});
            }
        }

        // ================================================================
        // STEP 3.5 (Phase 4): ESCALATE — create escalations for repeated failures
        // ================================================================
        for (const [fn, failCount] of Object.entries(failureCountByFn)) {
            if (failCount >= 2) {
                // Check if escalation already open for this agent
                const escalationAlreadyOpen = (openEscalations ?? []).some(e => e.agent_id === fn);
                if (!escalationAlreadyOpen) {
                    const { error: escErr } = await supabase.from('escalations').insert({
                        agent_id:    fn,
                        reason:      `${fn} failed ${failCount} times in the last 3 hours`,
                        retry_count: failCount,
                        status:      'open'
                    });

                    if (!escErr) {
                        console.log(`[${cycleId}] 🚨 Escalation created for ${fn} (${failCount} failures)`);
                        await supabase.rpc('write_signal', {
                            p_event_type: 'brain.escalation_created',
                            p_entity_type: 'system',
                            p_entity_id: null,
                            p_source: 'cron-worker',
                            p_data: { fn, fail_count: failCount, cycle_id: cycleId }
                        });
                    }
                }
            }
        }

        // Auto-close stale escalations (> 48h with no human response)
        await supabase
            .from('escalations')
            .update({ status: 'ignored', human_response: 'Auto-closed after 48h with no response' })
            .eq('status', 'open')
            .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

        // ================================================================
        // STEP 4: LOG — record full cycle to agent_decisions
        // ================================================================
        await supabase.from('agent_decisions').insert({
            agent_id: 'cron-worker',
            decision_type: actionsToExecute.length > 0 ? actionsToExecute[0].type : 'NONE',
            context: {
                cycle_id: cycleId,
                snapshot_summary: {
                    mrr:             snapshot.health.mrr_thb,
                    claimed:         snapshot.health.claimed_providers,
                    alerts:          snapshot.alert_count,
                    signals_unread:  snapshot.brain.signals_unread,
                    kpi_breaches:    criticalKpi.length + warningKpi.length,
                    strategy_confidence: Object.fromEntries(
                        Object.entries(strategyMap).map(([k, v]) => [k, v.confidence])
                    )
                },
                actions_considered: actionsToTake.length,
                actions_executed:   actionsToExecute.length,
                goal_tasks_queued:  (goalTasks ?? []).length
            },
            action: {
                actions: actionsToExecute.map(a => ({ type: a.type, reason: a.reason, fn: a.fn }))
            },
            result: {
                executions:   executionResults,
                duration_ms:  Date.now() - startTime,
                escalations:  Object.entries(failureCountByFn).filter(([, c]) => c >= 2).length
            },
            success: executionResults.every(r => r.success) || executionResults.length === 0
        });

        // Mark processed signals as done
        if (snapshot.brain.signals_unread > 0) {
            await supabase
                .from('signals')
                .update({
                    processed:    true,
                    processed_at: new Date().toISOString(),
                    brain_action: { cycle_id: cycleId, actions_taken: executionResults.map(r => r.type) }
                })
                .eq('processed', false)
                .lt('created_at', new Date().toISOString());
        }

        // ================================================================
        // STEP 5: ALERT — Telegram for critical issues
        // ================================================================
        const telegramToken  = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        const kpiBreachLines = criticalKpi.map((b: any) =>
            `🔴 KPI CRITICAL: ${b.metric_name} = ${b.current_value} (threshold: ${b.critical_threshold})`
        ).join('\n');

        const escalationLines = Object.entries(failureCountByFn)
            .filter(([, c]) => c >= 2)
            .map(([fn, c]) => `🚨 ESCALATED: ${fn} failed ${c}× in 3h`)
            .join('\n');

        const hasAlerts = snapshot.alert_count > 0 || criticalKpi.length > 0 || Object.values(failureCountByFn).some(c => c >= 2);

        if (hasAlerts && telegramToken && telegramChatId) {
            const snapshotAlertLines = snapshot.alerts.map(a => {
                const icon = (a.priority ?? 50) >= 90 ? '🔴' : (a.priority ?? 50) >= 70 ? '🟠' : '🟡';
                return `${icon} ${a.message}`;
            }).join('\n');

            const msg = [
                `🤖 *KOSMOI BRAIN — Cycle Report*`,
                ``,
                `📊 MRR: ${snapshot.health.mrr_thb}฿ | Claimed: ${snapshot.health.claimed_providers}`,
                snapshot.alert_count > 0 ? `⚠️ Snapshot alerts: ${snapshot.alert_count}` : '',
                criticalKpi.length > 0    ? `🔴 KPI breaches: ${criticalKpi.length}` : '',
                ``,
                snapshotAlertLines,
                kpiBreachLines,
                escalationLines,
                ``,
                `⚡ Actions taken: ${executionResults.filter(r => r.success).length}/${actionsToExecute.length}`
            ].filter(Boolean).join('\n');

            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'Markdown' })
            }).catch(() => {});
        }

        // ================================================================
        // STEP 5.5: DAILY BRIEFING — morning summary to founder (07:00–07:59 UTC)
        // ================================================================
        if (hourOfDay === 7 && telegramToken && telegramChatId) {
            // Fetch yesterday's brain activity
            const { data: actionsYesterday } = await supabase
                .from('signals')
                .select('event_type, data, created_at')
                .in('event_type', ['brain.action_taken', 'onboarding.welcome_sent', 'email.inbound_received'])
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })
                .limit(20);

            const onboardings24h  = (actionsYesterday ?? []).filter(s => s.event_type === 'onboarding.welcome_sent').length;
            const brainActions24h = (actionsYesterday ?? []).filter(s => s.event_type === 'brain.action_taken').length;
            const inboundEmails24h = (actionsYesterday ?? []).filter(s => s.event_type === 'email.inbound_received').length;

            // Fetch open goals
            const { data: openGoals } = await supabase
                .from('company_goals')
                .select('title, current_value, target_value, unit')
                .eq('status', 'active')
                .limit(5);

            const goalLines = (openGoals ?? []).map(g => {
                const pct = Math.round((g.current_value / Math.max(g.target_value, 1)) * 100);
                const bar = pct >= 80 ? '🟢' : pct >= 50 ? '🟡' : '🔴';
                return `${bar} ${g.title}: ${g.current_value}/${g.target_value} ${g.unit ?? ''} (${pct}%)`;
            }).join('\n');

            const briefingMsg = [
                `☀️ *KOSMOI DAILY BRIEFING* — ${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}`,
                ``,
                `📊 *Platform Health*`,
                `• MRR: ${snapshot.health.mrr_thb.toLocaleString()}฿`,
                `• Claimed businesses: ${snapshot.health.claimed_providers}`,
                `• Active subscriptions: ${snapshot.health.active_subscriptions}`,
                ``,
                `🤖 *Brain Activity (24h)*`,
                `• Actions executed: ${brainActions24h}`,
                `• New businesses onboarded: ${onboardings24h}`,
                `• Inbound emails received: ${inboundEmails24h}`,
                `• Unread signals: ${snapshot.brain.signals_unread}`,
                criticalKpi.length > 0 ? `• ⚠️ KPI breaches: ${criticalKpi.map((b: any) => b.metric_name).join(', ')}` : `• ✅ No KPI breaches`,
                ``,
                openGoals?.length ? `🎯 *Goals*\n${goalLines}` : '',
                ``,
                `💡 Today's priority: ${actionsToTake[0] ? actionsToTake[0].reason : 'Platform looks healthy — no critical actions'}`,
            ].filter(Boolean).join('\n');

            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: telegramChatId, text: briefingMsg, parse_mode: 'Markdown' })
            }).catch(() => {});

            console.log(`[${cycleId}] ☀️ Daily briefing sent to Telegram`);
        }

        // ================================================================
        // RETURN
        // ================================================================
        const summary = {
            status: 'OK',
            cycle_id: cycleId,
            snapshot: {
                mrr_thb:          snapshot.health.mrr_thb,
                claimed_providers: snapshot.health.claimed_providers,
                alerts:            snapshot.alert_count,
                signals_unread:    snapshot.brain.signals_unread,
                kpi_breaches:      criticalKpi.length + warningKpi.length
            },
            strategy: {
                outreach_window_open: outreachWindowOpen,
                strategies_loaded:    Object.keys(strategyMap).length
            },
            actions_considered: actionsToTake.length,
            actions_executed:   executionResults.length,
            actions_succeeded:  executionResults.filter(r => r.success).length,
            escalations_created: Object.entries(failureCountByFn).filter(([, c]) => c >= 2).length,
            goal_tasks_handled: (goalTasks ?? []).length,
            duration_ms: Date.now() - startTime,
            next_cycle: 'in 15 minutes'
        };

        console.log(`[${cycleId}] ✅ Cycle complete in ${summary.duration_ms}ms. ${summary.actions_succeeded}/${summary.actions_executed} actions succeeded.`);

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error(`[${cycleId}] 💥 Brain cycle failed:`, error.message);

        return new Response(JSON.stringify({
            status: 'ERROR',
            cycle_id: cycleId,
            error: error.message,
            duration_ms: Date.now() - startTime
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
