// @ts-nocheck
// @version 2.0.0 — 2026-03-20
// @changelog: Upgraded from hardcoded rules to Claude API Cortex with fallback
/**
 * 🧠 THE CORTEX — Autonomous Company Brain
 *
 * Runs every 15 minutes via pg_cron.
 * Cycle: Heartbeat → Observe → Load Memory → Reason (Claude) → Act → Learn → Report
 *
 * v2.0: Uses Claude API to reason about goals vs platform state.
 *       Falls back to hardcoded rules if Claude is unavailable.
 *       Routes actions through agent-exec for permission checks.
 *       Saves working memory and updates strategy confidence.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ACTIONS_PER_CYCLE = 5;

console.log('🧠 Cortex v2.0 starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();
    const cycleId = crypto.randomUUID();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // ================================================================
        // STEP 0: HEARTBEAT
        // ================================================================
        try {
            await supabase.rpc('write_signal', {
                p_event_type: 'brain.heartbeat',
                p_entity_type: 'system',
                p_entity_id: null,
                p_source: 'cortex',
                p_data: { cycle_id: cycleId, version: '2.0', started_at: new Date().toISOString() }
            });
        } catch (_) {}

        // ================================================================
        // STEP 1: OBSERVE — platform snapshot + recent signals + strategies
        // ================================================================
        console.log(`[${cycleId}] 👁 Observing...`);

        const [snapshotRes, recentSignals, strategies, workingMem, executiveDirectives] = await Promise.all([
            supabase.rpc('get_platform_snapshot'),
            supabase.from('signals')
                .select('event_type, source, data, created_at')
                .eq('processed', false)
                .order('created_at', { ascending: false })
                .limit(20),
            supabase.from('strategy_store')
                .select('key, value, confidence, notes')
                .order('confidence', { ascending: false })
                .limit(10),
            supabase.from('agent_working_memory')
                .select('key, value')
                .eq('agent_id', 'cortex')
                .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()),
            // Load active directives from Executive Council
            Promise.resolve().then(() => supabase.rpc('get_active_directives', { p_target_agent: 'cortex' })).catch(() => ({ data: [] }))
        ]);

        if (snapshotRes.error) throw new Error(`Snapshot failed: ${snapshotRes.error.message}`);
        const snapshot = snapshotRes.data;

        // Write snapshot signal
        await supabase.rpc('write_signal', {
            p_event_type: 'brain.snapshot',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'cortex',
            p_data: {
                cycle_id: cycleId,
                health_summary: snapshot.health,
                alert_count: snapshot.alert_count,
                signals_unread: snapshot.brain.signals_unread
            }
        });

        console.log(`[${cycleId}] 📊 MRR=${snapshot.health.mrr_thb}฿ | Claimed=${snapshot.health.claimed_providers} | Signals=${snapshot.brain.signals_unread} | Alerts=${snapshot.alert_count}`);

        // ================================================================
        // STEP 2: REASON — Claude API or fallback
        // ================================================================
        console.log(`[${cycleId}] 🧠 Reasoning...`);

        let actionsToTake;
        let reasoningMode = 'fallback';
        let reasoning = '';

        if (anthropicKey) {
            try {
                const cortexResult = await cortexReason(anthropicKey, {
                    snapshot,
                    recentSignals: recentSignals.data || [],
                    strategies: strategies.data || [],
                    workingMemory: workingMem.data || [],
                    directives: executiveDirectives.data || [],
                    cycleId
                });
                actionsToTake = cortexResult.actions;
                reasoning = cortexResult.reasoning;
                reasoningMode = 'claude';
                console.log(`[${cycleId}] 🤖 Claude reasoning: ${actionsToTake.length} actions proposed`);
            } catch (aiError: any) {
                console.warn(`[${cycleId}] ⚠️ Claude unavailable (${aiError.message}), using fallback rules`);
                actionsToTake = fallbackReason(snapshot);
                reasoning = 'Fallback: Claude API unavailable, using hardcoded rules';
            }
        } else {
            actionsToTake = fallbackReason(snapshot);
            reasoning = 'Fallback: No ANTHROPIC_API_KEY configured';
        }

        // Cap actions
        const actionsToExecute = actionsToTake.slice(0, MAX_ACTIONS_PER_CYCLE);

        console.log(`[${cycleId}] 📋 Mode: ${reasoningMode} | Actions: ${actionsToExecute.length}/${actionsToTake.length}`);

        // ================================================================
        // STEP 3: ACT — execute via agent-exec for permission checks
        // ================================================================
        console.log(`[${cycleId}] ⚡ Acting...`);

        const executionResults = [];

        for (const action of actionsToExecute) {
            const actionStart = Date.now();
            console.log(`[${cycleId}]   → ${action.type} via ${action.fn}...`);

            try {
                // Route through agent-exec for permission checks
                const response = await fetch(`${supabaseUrl}/functions/v1/agent-exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({
                        agent_id: 'cron-worker',
                        action: action.type,
                        params: { ...action.payload, target: action.fn, action: action.payload?.action },
                        reasoning: action.reason
                    })
                });

                const result = await response.json().catch(() => ({ status: response.status }));
                const success = response.ok;

                executionResults.push({
                    type: action.type,
                    success,
                    result,
                    duration_ms: Date.now() - actionStart
                });

                // Write signal
                await supabase.rpc('write_signal', {
                    p_event_type: success ? 'brain.action_taken' : 'brain.action_failed',
                    p_entity_type: 'system',
                    p_entity_id: null,
                    p_source: 'cortex',
                    p_data: {
                        cycle_id: cycleId,
                        action_type: action.type,
                        reason: action.reason,
                        fn: action.fn,
                        success,
                        reasoning_mode: reasoningMode,
                        duration_ms: Date.now() - actionStart
                    }
                });

                console.log(`[${cycleId}]   ${success ? '✅' : '❌'} ${action.type}`);

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
        // STEP 4: LEARN — save working memory + update strategy confidence
        // ================================================================
        console.log(`[${cycleId}] 📝 Learning...`);

        // Save cycle summary to working memory
        try {
            await supabase.rpc('upsert_agent_memory', {
                p_agent_id: 'cortex',
                p_key: 'last_cycle',
                p_value: JSON.stringify({
                    cycle_id: cycleId,
                    reasoning_mode: reasoningMode,
                    actions_taken: executionResults.map(r => ({ type: r.type, success: r.success })),
                    snapshot_summary: {
                        mrr: snapshot.health.mrr_thb,
                        claimed: snapshot.health.claimed_providers,
                        alerts: snapshot.alert_count
                    },
                    timestamp: new Date().toISOString()
                })
            });
        } catch (_) {}

        // Save reasoning for God View
        try {
            await supabase.rpc('upsert_agent_memory', {
                p_agent_id: 'cortex',
                p_key: 'last_reasoning',
                p_value: JSON.stringify({
                    mode: reasoningMode,
                    reasoning: reasoning.substring(0, 2000),
                    actions_proposed: actionsToTake.length,
                    actions_executed: actionsToExecute.length,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (_) {}

        // Log full cycle to agent_decisions
        await supabase.from('agent_decisions').insert({
            agent_id: 'cortex',
            decision_type: actionsToExecute.length > 0 ? actionsToExecute[0].type : 'OBSERVATION_ONLY',
            context: {
                cycle_id: cycleId,
                reasoning_mode: reasoningMode,
                reasoning: reasoning.substring(0, 1000),
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

        // Mark processed signals
        if (snapshot.brain.signals_unread > 0) {
            await supabase
                .from('signals')
                .update({
                    processed: true,
                    processed_at: new Date().toISOString(),
                    brain_action: { cycle_id: cycleId, actions_taken: executionResults.map(r => r.type) }
                })
                .eq('processed', false)
                .lt('created_at', new Date().toISOString());
        }

        // ================================================================
        // STEP 5: TELEGRAM — Always report
        // ================================================================
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        if (telegramToken && telegramChatId) {
            const alertLines = snapshot.alerts.length > 0
                ? snapshot.alerts.map(a => {
                    const icon = (a.priority ?? 50) >= 90 ? '🔴' : (a.priority ?? 50) >= 70 ? '🟠' : '🟡';
                    return `${icon} ${a.message}`;
                }).join('\n')
                : '✅ No alerts';

            const actionLines = executionResults.length > 0
                ? executionResults.map(r => `${r.success ? '✅' : '❌'} ${r.type} (${r.duration_ms}ms)`).join('\n')
                : '💤 No actions needed';

            const statusIcon = executionResults.some(r => !r.success) ? '🟠' : '🟢';
            const modeIcon = reasoningMode === 'claude' ? '🤖' : '⚙️';

            const msg = [
                `${statusIcon} *CORTEX v2.0 — ${cycleId.substring(0, 8)}*`,
                `${modeIcon} Mode: ${reasoningMode}`,
                ``,
                `📊 MRR: ${snapshot.health.mrr_thb}฿ | Claimed: ${snapshot.health.claimed_providers}`,
                `📡 Signals: ${snapshot.brain.signals_unread} unread | Alerts: ${snapshot.alert_count}`,
                ``,
                alertLines,
                ``,
                `⚡ *Actions (${executionResults.filter(r => r.success).length}/${actionsToExecute.length}):*`,
                actionLines,
                ``,
                reasoningMode === 'claude' ? `💭 _${reasoning.substring(0, 200)}_` : '',
                `⏱ ${Date.now() - startTime}ms`
            ].filter(Boolean).join('\n');

            try {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'Markdown' })
                });
            } catch (_) {}
        }

        // ================================================================
        // RETURN
        // ================================================================
        const summary = {
            status: 'OK',
            version: '2.0',
            cycle_id: cycleId,
            reasoning_mode: reasoningMode,
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

        console.log(`[${cycleId}] ✅ Cortex cycle complete in ${summary.duration_ms}ms (${reasoningMode}). ${summary.actions_succeeded}/${summary.actions_executed} actions.`);

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error(`[${cycleId}] 💥 Cortex cycle failed:`, error.message);
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

// ================================================================
// CORTEX REASONING (Claude API)
// ================================================================
async function cortexReason(apiKey: string, context: {
    snapshot: any;
    recentSignals: any[];
    strategies: any[];
    workingMemory: any[];
    directives: any[];
    cycleId: string;
}): Promise<{ actions: any[]; reasoning: string }> {

    const systemPrompt = `You are the Cortex — the autonomous brain of Kosmoi, a service marketplace platform in Koh Samui, Thailand.

You run every 15 minutes. Your job: observe the platform state, reason about what needs to happen, and output specific actions.

AVAILABLE ACTIONS (you can output 0-5 per cycle):
- { type: "RETENTION_CHURN_RESPONSE", fn: "retention-agent", payload: { action: "FULL_RUN" }, reason: "..." }
- { type: "SEND_TRIAL_REMINDERS", fn: "retention-agent", payload: { action: "SEND_TRIAL_REMINDERS" }, reason: "..." }
- { type: "PROCESS_STALE_LEADS", fn: "retention-agent", payload: { action: "PROCESS_STALE_LEADS" }, reason: "..." }
- { type: "PAYMENT_CHECK", fn: "payment-recovery", payload: { action: "PROCESS_SCHEDULED" }, reason: "..." }
- { type: "OUTREACH_STALE_LEADS", fn: "sales-scout", payload: { action: "invite_leads" }, reason: "..." }
- { type: "ROUTINE_OUTREACH", fn: "sales-scout", payload: { action: "invite_leads" }, reason: "..." }
- { type: "PROCESS_FOLLOWUPS", fn: "sales-outreach", payload: { action: "PROCESS_FOLLOWUPS" }, reason: "..." }
- { type: "PROCESS_PENDING_CLAIMS", fn: "admin-actions", payload: { action: "REVIEW_PENDING_CLAIMS" }, reason: "..." }
- { type: "ESCALATE_SUPPORT", fn: "support-router", payload: { action: "ESCALATE_ALL_URGENT" }, reason: "..." }

RULES:
1. NEVER hallucinate numbers — use only the data provided.
2. Prioritize revenue-impacting actions (churn, payments, conversions).
3. If nothing needs action, output 0 actions. Don't force actions.
4. Consider the strategies and their confidence scores when deciding.
5. EXECUTIVE DIRECTIVES take priority — if C-suite agents issued directives, follow them.
6. Be concise in your reasoning.

OUTPUT FORMAT (strict JSON):
{
  "reasoning": "Brief explanation of your thought process (1-3 sentences)",
  "actions": [ { "type": "...", "priority": 0-100, "reason": "...", "fn": "...", "payload": {...} } ]
}`;

    const userMessage = `Current cycle: ${context.cycleId}

PLATFORM STATE:
${JSON.stringify(context.snapshot, null, 2)}

UNPROCESSED SIGNALS (${context.recentSignals.length}):
${context.recentSignals.map(s => `- ${s.event_type} from ${s.source}: ${JSON.stringify(s.data || {}).substring(0, 100)}`).join('\n') || 'None'}

ACTIVE STRATEGIES:
${context.strategies.map(s => `- ${s.key} (confidence: ${s.confidence}): ${s.notes || JSON.stringify(s.value).substring(0, 80)}`).join('\n') || 'None'}

WORKING MEMORY:
${context.workingMemory.map(m => `- ${m.key}: ${JSON.stringify(m.value).substring(0, 100)}`).join('\n') || 'Empty (first boot)'}

EXECUTIVE DIRECTIVES (from C-suite — HIGH PRIORITY):
${(context.directives || []).map(d => `- [P${d.priority}] ${d.issued_by?.toUpperCase()}: ${d.title} — ${d.description?.substring(0, 100)}`).join('\n') || 'None active'}

What actions should be taken this cycle?`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
        })
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => 'unknown');
        throw new Error(`Claude API ${response.status}: ${errBody.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Claude returned non-JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const actions = (parsed.actions || []).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));

    return {
        actions,
        reasoning: parsed.reasoning || 'No reasoning provided'
    };
}

// ================================================================
// FALLBACK REASONING (Hardcoded rules — same as v1.0)
// ================================================================
function fallbackReason(snapshot: any): any[] {
    const actions = [];

    if (snapshot.brain.signals_critical > 0) {
        actions.push({
            type: 'PROCESS_CRITICAL_SIGNALS', priority: 100,
            reason: `${snapshot.brain.signals_critical} critical unprocessed signals`,
            fn: 'retention-agent', payload: { action: 'PROCESS_STALE_LEADS' }
        });
    }

    for (const alert of snapshot.alerts) {
        if (alert.type === 'CHURN') {
            actions.push({
                type: 'RETENTION_CHURN_RESPONSE', priority: 95,
                reason: alert.message, fn: 'retention-agent', payload: { action: 'FULL_RUN' }
            });
        }
        if (alert.type === 'ZERO_MRR') {
            actions.push({
                type: 'PAYMENT_CHECK', priority: 85,
                reason: alert.message, fn: 'payment-recovery', payload: { action: 'PROCESS_SCHEDULED' }
            });
        }
        if (alert.type === 'OUTREACH_FAILURE') {
            actions.push({
                type: 'OUTREACH_RETRY', priority: 75,
                reason: alert.message, fn: 'sales-outreach', payload: { action: 'PROCESS_FOLLOWUPS' }
            });
        }
    }

    if (snapshot.pipeline.claims_pending > 0) {
        actions.push({
            type: 'PROCESS_PENDING_CLAIMS', priority: 80,
            reason: `${snapshot.pipeline.claims_pending} claims waiting`,
            fn: 'admin-actions', payload: { action: 'REVIEW_PENDING_CLAIMS' }
        });
    }

    if (snapshot.alerts.find((a: any) => a.type === 'STALE_LEADS')) {
        actions.push({
            type: 'OUTREACH_STALE_LEADS', priority: 70,
            reason: 'Stale leads need outreach', fn: 'sales-scout', payload: { action: 'invite_leads' }
        });
    }

    if (snapshot.pipeline.invites_sent_7d < 10 && snapshot.growth.unclaimed_providers > 20) {
        actions.push({
            type: 'ROUTINE_OUTREACH', priority: 30,
            reason: `Only ${snapshot.pipeline.invites_sent_7d} invites this week`,
            fn: 'sales-scout', payload: { action: 'invite_leads' }
        });
    }

    if (snapshot.brain.actions_24h === 0) {
        actions.push({
            type: 'RETENTION_CHECK', priority: 50,
            reason: 'Brain was dormant', fn: 'retention-agent', payload: { action: 'SEND_TRIAL_REMINDERS' }
        });
    }

    return actions.sort((a: any, b: any) => b.priority - a.priority);
}
