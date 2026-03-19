// @ts-nocheck
/**
 * 🤖 CRON WORKER - THE ALWAYS-ON CEO
 * 
 * This is the "heartbeat" that runs 24/7 without any human.
 * 
 * Schedule this to run every 15 minutes using:
 * - cron-job.org (free)
 * - Supabase pg_cron
 * - Vercel Cron
 * - Or any cron service
 * 
 * It will:
 * 1. Analyze company health
 * 2. Decide what needs attention
 * 3. Execute the highest priority action
 * 4. Log everything
 * 5. Send alerts if needed
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority thresholds
const PRIORITIES = {
    PAYMENT_RECOVERY: 100,
    URGENT_SUPPORT: 90,
    STALE_LEADS: 70,
    TRIAL_EXPIRING: 60,
    OUTREACH: 30,
};

console.log('🤖 Cron Worker - Autonomous CEO Starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('🧠 Analyzing company state...');

        // ============================================
        // STEP 1: ANALYZE EVERYTHING
        // ============================================
        const analysis = {
            issues: [],
            metrics: {},
            timestamp: new Date().toISOString()
        };

        // Check failed payments
        const { data: failedPayments, count: paymentCount } = await supabase
            .from('payment_recovery_attempts')
            .select('*', { count: 'exact' })
            .eq('status', 'pending');

        if (paymentCount > 0) {
            analysis.issues.push({
                type: 'PAYMENT_RECOVERY',
                priority: PRIORITIES.PAYMENT_RECOVERY,
                count: paymentCount,
                message: `${paymentCount} payment(s) need recovery`
            });
        }

        // Check urgent support
        const { data: urgentTickets, count: ticketCount } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact' })
            .eq('priority', 'urgent')
            .eq('status', 'open');

        if (ticketCount > 0) {
            analysis.issues.push({
                type: 'URGENT_SUPPORT',
                priority: PRIORITIES.URGENT_SUPPORT,
                count: ticketCount,
                message: `${ticketCount} urgent ticket(s)`
            });
        }

        // Check stale leads (48+ hours old, still 'new')
        const staleTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: staleLeads, count: staleCount } = await supabase
            .from('leads')
            .select('id', { count: 'exact' })
            .eq('status', 'new')
            .lt('created_at', staleTime);

        if (staleCount > 0) {
            analysis.issues.push({
                type: 'STALE_LEADS',
                priority: PRIORITIES.STALE_LEADS,
                count: staleCount,
                message: `${staleCount} stale lead(s)`
            });
        }

        // Check expiring trials (3 days or less)
        const trialExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const { count: expiringCount } = await supabase
            .from('subscriptions')
            .select('id', { count: 'exact' })
            .eq('status', 'trial')
            .lt('trial_ends_at', trialExpiry);

        if (expiringCount > 0) {
            analysis.issues.push({
                type: 'TRIAL_EXPIRING',
                priority: PRIORITIES.TRIAL_EXPIRING,
                count: expiringCount,
                message: `${expiringCount} trial(s) expiring soon`
            });
        }

        // Check businesses ready for outreach
        const { count: outreachCount } = await supabase
            .from('service_providers')
            .select('id', { count: 'exact' })
            .is('status', null)
            .not('email', 'is', null);

        if (outreachCount > 0) {
            analysis.issues.push({
                type: 'OUTREACH',
                priority: PRIORITIES.OUTREACH,
                count: outreachCount,
                message: `${outreachCount} business(es) ready for outreach`
            });
        }

        // Sort by priority
        analysis.issues.sort((a, b) => b.priority - a.priority);

        // ============================================
        // STEP 2: DECIDE WHAT TO DO
        // ============================================
        let decision = {
            action: 'NONE',
            reason: 'All systems nominal',
            executed: false
        };

        if (analysis.issues.length > 0) {
            const topIssue = analysis.issues[0];
            decision = {
                action: topIssue.type,
                reason: topIssue.message,
                count: topIssue.count,
                priority: topIssue.priority,
                executed: false
            };
        }

        // ============================================
        // STEP 3: EXECUTE THE ACTION
        // ============================================
        if (decision.action !== 'NONE') {
            console.log(`⚡ Executing: ${decision.action}`);

            const endpoints = {
                PAYMENT_RECOVERY: { fn: 'payment-recovery', payload: { action: 'PROCESS_SCHEDULED' } },
                URGENT_SUPPORT: { fn: 'support-router', payload: { action: 'ESCALATE_ALL_URGENT' } },
                STALE_LEADS: { fn: 'retention-agent', payload: { action: 'PROCESS_STALE_LEADS' } },
                TRIAL_EXPIRING: { fn: 'retention-agent', payload: { action: 'SEND_TRIAL_REMINDERS' } },
                OUTREACH: { fn: 'sales-outreach', payload: { action: 'PROCESS_FOLLOWUPS' } }
            };

            const endpoint = endpoints[decision.action];
            if (endpoint) {
                try {
                    const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint.fn}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseKey}`
                        },
                        body: JSON.stringify(endpoint.payload)
                    });

                    const result = await response.json();
                    decision.executed = true;
                    decision.result = result;
                } catch (execError) {
                    decision.error = execError.message;
                }
            }
        }

        // ============================================
        // STEP 4: LOG THE DECISION
        // ============================================
        await supabase.from('agent_decisions').insert({
            agent_id: 'cron-worker',
            decision_type: decision.action,
            context: { analysis: analysis.issues.slice(0, 5) },
            action: decision,
            result: { executed: decision.executed, duration: Date.now() - startTime },
            success: decision.executed || decision.action === 'NONE'
        });

        // ============================================
        // STEP 5: SEND TELEGRAM ALERT FOR CRITICAL ISSUES
        // ============================================
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        // Alert on critical issues (priority >= 90)
        const criticalIssues = analysis.issues.filter(i => i.priority >= 90);
        if (criticalIssues.length > 0 && telegramToken && telegramChatId) {
            const alertMessage = `
🚨 *KOSMOI ALERT*

${criticalIssues.map(i => `${i.priority >= 100 ? '🔴' : '🟠'} ${i.message}`).join('\n')}

Action: ${decision.action}
Executed: ${decision.executed ? '✅' : '❌'}
            `.trim();

            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: alertMessage,
                    parse_mode: 'Markdown'
                })
            });
        }

        // ============================================
        // RETURN SUMMARY
        // ============================================
        const summary = {
            status: 'OK',
            issues_found: analysis.issues.length,
            action_taken: decision.action,
            executed: decision.executed,
            duration_ms: Date.now() - startTime,
            next_check: 'in 15 minutes',
            timestamp: new Date().toISOString()
        };

        console.log('✅ Cron Worker completed:', summary);

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Cron Worker Error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            duration_ms: Date.now() - startTime
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
