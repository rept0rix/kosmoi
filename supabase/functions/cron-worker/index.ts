// @ts-nocheck
/**
 * 🤖 CRON WORKER — THE AUTONOMOUS BRAIN
 *
 * Runs every 15 minutes via pg_cron.
 * Uses get_platform_snapshot() to SEE the platform state
 * before making any decision — exactly like a human admin would.
 *
 * Cycle: Observe → Reason → Act → Log
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
        // This is exactly what a human sees when opening the admin panel.
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

        // Write snapshot itself as a signal (so admin can query recent snapshots)
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
        // STEP 2: REASON — decide what actions to take based on what we see
        // Priority queue: alerts first, then opportunities, then maintenance
        // ================================================================
        console.log(`[${cycleId}] 🧠 Reasoning...`);

        const actionsToTake: Array<{
            type: string;
            priority: number;
            reason: string;
            fn: string;
            payload: object;
        }> = [];

        // --- CRITICAL: Unprocessed critical signals (churn, payment failure) ---
        if (snapshot.brain.signals_critical > 0) {
            actionsToTake.push({
                type: 'PROCESS_CRITICAL_SIGNALS',
                priority: 100,
                reason: `${snapshot.brain.signals_critical} critical unprocessed signals`,
                fn: 'retention-agent',
                payload: { action: 'PROCESS_STALE_LEADS' }
            });
        }

        // --- HIGH: Explicit alerts from snapshot ---
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

        // --- MEDIUM: Claims pending review (people who paid but aren't verified) ---
        if (snapshot.pipeline.claims_pending > 0) {
            actionsToTake.push({
                type: 'PROCESS_PENDING_CLAIMS',
                priority: 80,
                reason: `${snapshot.pipeline.claims_pending} claims waiting for verification`,
                fn: 'admin-actions',
                payload: { action: 'REVIEW_PENDING_CLAIMS' }
            });
        }

        // --- MEDIUM: Stale leads (businesses scouted but never contacted) ---
        if (alert => snapshot.alerts.find(a => a.type === 'STALE_LEADS')) {
            actionsToTake.push({
                type: 'OUTREACH_STALE_LEADS',
                priority: 70,
                reason: 'Stale leads need outreach',
                fn: 'sales-scout',
                payload: { action: 'invite_leads' }
            });
        }

        // --- LOW: Regular outreach (if we haven't sent many invites this week) ---
        if (snapshot.pipeline.invites_sent_7d < 10 && snapshot.growth.unclaimed_providers > 20) {
            actionsToTake.push({
                type: 'ROUTINE_OUTREACH',
                priority: 30,
                reason: `Only ${snapshot.pipeline.invites_sent_7d} invites sent this week, ${snapshot.growth.unclaimed_providers} unclaimed providers`,
                fn: 'sales-scout',
                payload: { action: 'invite_leads' }
            });
        }

        // --- LOW: Trial reminders (if subscriptions are about to expire) ---
        if (snapshot.brain.actions_24h === 0) {
            // Brain was dormant — run retention check
            actionsToTake.push({
                type: 'RETENTION_CHECK',
                priority: 50,
                reason: 'Brain was dormant — running retention check',
                fn: 'retention-agent',
                payload: { action: 'SEND_TRIAL_REMINDERS' }
            });
        }

        // Sort by priority descending
        actionsToTake.sort((a, b) => b.priority - a.priority);

        console.log(`[${cycleId}] 📋 Actions queued: ${actionsToTake.length}`, actionsToTake.map(a => `${a.type}(${a.priority})`).join(', '));

        // ================================================================
        // STEP 3: ACT — execute actions in priority order (up to 3 per cycle)
        // We cap at 3 to avoid overwhelming downstream functions
        // ================================================================
        console.log(`[${cycleId}] ⚡ Acting...`);

        const executionResults: Array<{
            type: string;
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
                    success,
                    result,
                    duration_ms: Date.now() - actionStart
                });

                // Write signal for each action taken
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
                        duration_ms: Date.now() - actionStart
                    }
                });

                console.log(`[${cycleId}]   ✅ ${action.type}: ${success ? 'OK' : 'FAILED'}`);

            } catch (execError: any) {
                executionResults.push({
                    type: action.type,
                    success: false,
                    error: execError.message,
                    duration_ms: Date.now() - actionStart
                });
                console.error(`[${cycleId}]   ❌ ${action.type}: ${execError.message}`);
            }
        }

        // ================================================================
        // STEP 4: LOG — record full cycle to agent_decisions
        // ================================================================
        await supabase.from('agent_decisions').insert({
            agent_id: 'cron-worker',
            decision_type: actionsToExecute.length > 0 ? actionsToExecute[0].type : 'NONE',
            context: {
                cycle_id: cycleId,
                snapshot_summary: {
                    mrr: snapshot.health.mrr_thb,
                    claimed: snapshot.health.claimed_providers,
                    alerts: snapshot.alert_count,
                    signals_unread: snapshot.brain.signals_unread
                },
                actions_considered: actionsToTake.length,
                actions_executed: actionsToExecute.length
            },
            action: {
                actions: actionsToExecute.map(a => ({ type: a.type, reason: a.reason, fn: a.fn }))
            },
            result: {
                executions: executionResults,
                duration_ms: Date.now() - startTime
            },
            success: executionResults.every(r => r.success) || executionResults.length === 0
        });

        // Mark processed signals as done
        if (snapshot.brain.signals_unread > 0) {
            await supabase
                .from('signals')
                .update({
                    processed: true,
                    processed_at: new Date().toISOString(),
                    brain_action: { cycle_id: cycleId, actions_taken: executionResults.map(r => r.type) }
                })
                .eq('processed', false)
                .lt('created_at', new Date().toISOString()); // Mark all signals seen in this cycle
        }

        // ================================================================
        // STEP 5: ALERT — Telegram for critical issues
        // ================================================================
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        if (snapshot.alert_count > 0 && telegramToken && telegramChatId) {
            const alertLines = snapshot.alerts.map(a => {
                const icon = (a.priority ?? 50) >= 90 ? '🔴' : (a.priority ?? 50) >= 70 ? '🟠' : '🟡';
                return `${icon} ${a.message}`;
            }).join('\n');

            const msg = [
                `🤖 *KOSMOI BRAIN — Cycle Report*`,
                ``,
                `📊 MRR: ${snapshot.health.mrr_thb}฿ | Claimed: ${snapshot.health.claimed_providers}`,
                `⚠️ Alerts: ${snapshot.alert_count}`,
                ``,
                alertLines,
                ``,
                `⚡ Actions taken: ${executionResults.filter(r => r.success).length}/${actionsToExecute.length}`
            ].join('\n');

            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'Markdown' })
            }).catch(() => {}); // Non-fatal
        }

        // ================================================================
        // RETURN
        // ================================================================
        const summary = {
            status: 'OK',
            cycle_id: cycleId,
            snapshot: {
                mrr_thb: snapshot.health.mrr_thb,
                claimed_providers: snapshot.health.claimed_providers,
                alerts: snapshot.alert_count,
                signals_unread: snapshot.brain.signals_unread
            },
            actions_considered: actionsToTake.length,
            actions_executed: executionResults.length,
            actions_succeeded: executionResults.filter(r => r.success).length,
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
