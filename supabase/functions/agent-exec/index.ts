// @ts-nocheck
// @version 1.0.0 — 2026-03-20
// @changelog: Initial agent execution engine
/**
 * AGENT EXECUTION ENGINE (agent-exec)
 *
 * The bridge between autonomous decisions and real actions.
 * Every agent action flows through here:
 *
 *   Cortex → agent-exec → target (Edge Function / DB / API)
 *
 * Responsibilities:
 * 1. Permission check (agent_capabilities table)
 * 2. Resource lock check (prevent conflicts)
 * 3. Route to target execution
 * 4. Write signal with result
 * 5. Log to agent_decisions
 * 6. Return result
 *
 * Supports dry_run mode for testing without side effects.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('⚡ Agent Execution Engine Starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const {
            agent_id,
            action,
            params = {},
            reasoning = '',
            dry_run = false,
            expected_outcome = null
        } = body;

        if (!agent_id || !action) {
            return respond(400, { error: 'agent_id and action are required' });
        }

        // Non-fatal signal writer
        const sig = (eventType: string, data: object) =>
            supabase.rpc('write_signal', {
                p_event_type: eventType,
                p_entity_type: 'agent',
                p_entity_id: agent_id,
                p_source: 'agent-exec',
                p_data: { ...data, agent_id, action, dry_run }
            }).catch(() => {});

        console.log(`[${agent_id}] ${dry_run ? '🧪 DRY RUN' : '⚡'} Action: ${action}`);

        // ================================================================
        // STEP 1: PERMISSION CHECK
        // ================================================================
        const capabilityType = getCapabilityType(action);
        const target = getTarget(action, params);

        const { data: capability } = await supabase
            .from('agent_capabilities')
            .select('*')
            .eq('agent_id', agent_id)
            .eq('capability', capabilityType)
            .eq('target', target)
            .eq('enabled', true)
            .single();

        if (!capability) {
            await sig('agent.permission_denied', { capability: capabilityType, target });
            return respond(403, {
                error: `Agent ${agent_id} lacks permission: ${capabilityType} → ${target}`,
                agent_id, action
            });
        }

        if (capability.permission === 'deny') {
            await sig('agent.permission_denied', { capability: capabilityType, target, reason: 'explicitly denied' });
            return respond(403, { error: `Action explicitly denied for ${agent_id}`, agent_id, action });
        }

        if (capability.permission === 'require_approval') {
            // Queue for human approval
            await supabase.from('agent_approvals').insert({
                agent_id,
                action,
                params,
                reasoning,
                status: 'pending'
            });
            await sig('agent.approval_required', { action, reasoning });
            return respond(202, {
                status: 'approval_required',
                message: `Action ${action} queued for human approval`,
                agent_id
            });
        }

        // Check daily limits from constraints
        if (capability.constraints?.max_per_day) {
            const today = new Date().toISOString().split('T')[0];
            const { count } = await supabase
                .from('agent_decisions')
                .select('*', { count: 'exact', head: true })
                .eq('agent_id', agent_id)
                .eq('decision_type', action)
                .gte('created_at', `${today}T00:00:00Z`);

            if ((count || 0) >= capability.constraints.max_per_day) {
                await sig('agent.daily_limit_reached', {
                    limit: capability.constraints.max_per_day, current: count
                });
                return respond(429, {
                    error: `Daily limit reached: ${count}/${capability.constraints.max_per_day}`,
                    agent_id, action
                });
            }
        }

        // ================================================================
        // STEP 2: DRY RUN CHECK
        // ================================================================
        if (dry_run) {
            const dryResult = {
                status: 'dry_run',
                would_execute: { action, params, target, capability_type: capabilityType },
                agent_id,
                reasoning,
                permission: 'granted',
                message: 'Action validated but NOT executed (dry_run=true)'
            };

            await supabase.from('agent_decisions').insert({
                agent_id,
                decision_type: action,
                context: { reasoning, dry_run: true },
                action: { action, params },
                result: dryResult,
                success: true,
                expected_outcome
            });

            await sig('agent.dry_run', dryResult);
            return respond(200, dryResult);
        }

        // ================================================================
        // STEP 3: EXECUTE ACTION
        // ================================================================
        let result;

        switch (capabilityType) {
            case 'call_edge_function':
                result = await executeEdgeFunction(supabaseUrl, supabaseKey, target, params);
                break;

            case 'db_write':
                result = await executeDbWrite(supabase, target, params);
                break;

            case 'external_api':
                result = await executeExternalApi(target, params);
                break;

            case 'claude_api':
                result = { success: false, error: 'Claude API routing not yet implemented' };
                break;

            default:
                result = { success: false, error: `Unknown capability type: ${capabilityType}` };
        }

        // ================================================================
        // STEP 4: LOG & SIGNAL
        // ================================================================
        const duration_ms = Date.now() - startTime;

        await supabase.from('agent_decisions').insert({
            agent_id,
            decision_type: action,
            context: { reasoning, capability: capabilityType, target },
            action: { action, params },
            result: { ...result, duration_ms },
            success: result.success,
            expected_outcome
        });

        await sig(result.success ? 'agent.action_completed' : 'agent.action_failed', {
            result_summary: result.message || (result.success ? 'OK' : 'FAILED'),
            duration_ms
        });

        console.log(`[${agent_id}] ${result.success ? '✅' : '❌'} ${action} (${duration_ms}ms)`);

        return respond(result.success ? 200 : 500, {
            ...result,
            agent_id,
            action,
            duration_ms
        });

    } catch (error: any) {
        console.error('Agent Exec Error:', error.message);
        return respond(500, { error: error.message, success: false });
    }

    function respond(status: number, body: object) {
        return new Response(JSON.stringify(body), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status
        });
    }
});

// ================================================================
// ROUTING HELPERS
// ================================================================

function getCapabilityType(action: string): string {
    if (action.startsWith('call:')) return 'call_edge_function';
    if (action.startsWith('db:')) return 'db_write';
    if (action.startsWith('api:')) return 'external_api';
    if (action.startsWith('ai:')) return 'claude_api';
    // Legacy action names — map to edge function calls
    const edgeFunctionActions = [
        'FULL_RUN', 'PROCESS_STALE_LEADS', 'SEND_TRIAL_REMINDERS',
        'PAYMENT_FAILED', 'RETRY_PAYMENT', 'PROCESS_SCHEDULED',
        'scout_location', 'invite_leads', 'search_places',
        'NEW_BUSINESS', 'PROCESS_FOLLOWUPS',
        'NEW_MESSAGE', 'ESCALATE_ALL_URGENT',
        'REVIEW_PENDING_CLAIMS'
    ];
    if (edgeFunctionActions.includes(action)) return 'call_edge_function';
    return 'call_edge_function'; // default
}

function getTarget(action: string, params: any): string {
    // Prefixed actions: "call:sales-scout" → "sales-scout"
    if (action.includes(':')) return action.split(':')[1];

    // Legacy action → function mapping
    const actionToFunction: Record<string, string> = {
        'FULL_RUN': 'retention-agent',
        'PROCESS_STALE_LEADS': 'retention-agent',
        'SEND_TRIAL_REMINDERS': 'retention-agent',
        'PAYMENT_FAILED': 'payment-recovery',
        'RETRY_PAYMENT': 'payment-recovery',
        'PROCESS_SCHEDULED': 'payment-recovery',
        'scout_location': 'sales-scout',
        'invite_leads': 'sales-scout',
        'search_places': 'sales-scout',
        'NEW_BUSINESS': 'sales-outreach',
        'PROCESS_FOLLOWUPS': 'sales-outreach',
        'NEW_MESSAGE': 'support-router',
        'ESCALATE_ALL_URGENT': 'support-router',
        'REVIEW_PENDING_CLAIMS': 'admin-actions',
    };
    return actionToFunction[action] || params?.target || action;
}

// ================================================================
// EXECUTORS
// ================================================================

async function executeEdgeFunction(
    supabaseUrl: string, supabaseKey: string,
    functionName: string, params: any
): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ action: params.action || params.type, ...params })
        });

        const data = await response.json().catch(() => ({ status: response.status }));
        return {
            success: response.ok,
            message: data.message || (response.ok ? 'Edge function executed' : `Failed: ${response.status}`),
            data
        };
    } catch (error: any) {
        return { success: false, message: `Edge function error: ${error.message}` };
    }
}

async function executeDbWrite(
    supabase: any, table: string, params: any
): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        const { operation = 'insert', data: rowData, filters = {} } = params;

        let query;
        if (operation === 'insert') {
            query = supabase.from(table).insert(rowData).select();
        } else if (operation === 'update') {
            query = supabase.from(table).update(rowData);
            for (const [key, val] of Object.entries(filters)) {
                query = query.eq(key, val);
            }
            query = query.select();
        } else if (operation === 'upsert') {
            query = supabase.from(table).upsert(rowData).select();
        } else {
            return { success: false, message: `Unknown DB operation: ${operation}` };
        }

        const { data, error } = await query;
        if (error) return { success: false, message: error.message };
        return { success: true, message: `${operation} on ${table} OK`, data };
    } catch (error: any) {
        return { success: false, message: `DB write error: ${error.message}` };
    }
}

async function executeExternalApi(
    target: string, params: any
): Promise<{ success: boolean; message: string; data?: any }> {
    // External API calls are handled by their respective Edge Functions
    // This is a placeholder for direct API calls (Resend, Stripe, etc.)
    return {
        success: false,
        message: `Direct external API calls should go through dedicated Edge Functions. Use call:send-email or call:stripe-webhook instead.`
    };
}
