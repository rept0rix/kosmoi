// @ts-nocheck
/**
 * 📋 PM AGENT — Product Manager
 *
 * Runs weekly (Sunday 08:00 UTC) via cron-worker.
 * Analyzes platform signals + KPIs + goals to decide what to build next.
 *
 * Flow:
 *  1. Read last 7 days of signals (what happened)
 *  2. Read KPI snapshots + breaches (how we're performing)
 *  3. Read company goals (where we need to go)
 *  4. Ask Claude to reason as a PM and produce a prioritised backlog
 *  5. Write top 3 recommendations as agent_tasks (type: pm_recommendation)
 *  6. Send weekly Telegram brief to founder
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_KEY    = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const TELEGRAM_TOKEN   = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_ALERT_CHAT_ID') ?? '';

const PM_SYSTEM_PROMPT = `You are an experienced product manager for Kosmoi, a B2B2C business discovery platform in Koh Samui, Thailand.

Kosmoi's business model:
- Business owners pay 1 THB to claim their listing (verification)
- Revenue comes from monthly subscriptions (~590฿/mo) for premium features
- Users (tourists/expats) discover and book local businesses
- Key metrics: claimed businesses, MRR, active users, booking volume

Your task: analyze the weekly platform data and recommend the top 3 highest-leverage product improvements.

For each recommendation, provide:
- title: short action title
- priority: HIGH | MEDIUM | LOW
- metric_impact: which KPI this will move (mrr, claimed_providers, bookings, active_users, retention)
- rationale: 1-2 sentence explanation based on the data
- suggested_action: specific implementation step

Return JSON only:
{
  "week_summary": "1-2 sentence overview of platform health",
  "recommendations": [
    {
      "title": "...",
      "priority": "HIGH|MEDIUM|LOW",
      "metric_impact": "...",
      "rationale": "...",
      "suggested_action": "..."
    }
  ],
  "founder_note": "1 sentence personal note to the founder about this week"
}`;

async function runPmAnalysis(context: {
    signalSummary: object;
    kpiBreachers: object[];
    goals: object[];
    snapshot: object;
}): Promise<{
    week_summary: string;
    recommendations: Array<{
        title: string;
        priority: string;
        metric_impact: string;
        rationale: string;
        suggested_action: string;
    }>;
    founder_note: string;
} | null> {
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

    const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [
            {
                role: 'user',
                content: `Weekly platform data for analysis:

## Platform Snapshot
${JSON.stringify(context.snapshot, null, 2)}

## Signal Activity (Last 7 Days)
${JSON.stringify(context.signalSummary, null, 2)}

## KPI Breaches
${JSON.stringify(context.kpiBreachers, null, 2)}

## Company Goals
${JSON.stringify(context.goals, null, 2)}

Based on this data, what are the top 3 product improvements we should build this week?`
            }
        ],
        system: PM_SYSTEM_PROMPT,
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Signal summary — count by event type for the last 7 days
        const { data: signalRows } = await supabase
            .from('signals')
            .select('event_type')
            .gte('created_at', sevenDaysAgo);

        const signalSummary: Record<string, number> = {};
        for (const s of signalRows ?? []) {
            signalSummary[s.event_type] = (signalSummary[s.event_type] ?? 0) + 1;
        }

        // 2. KPI breaches
        const { data: kpiBreaches } = await supabase.rpc('get_kpi_breaches');

        // 3. Company goals
        const { data: goals } = await supabase
            .from('company_goals')
            .select('title, metric_key, current_value, target_value, unit, status')
            .eq('status', 'active')
            .limit(8);

        // 4. Latest platform snapshot
        const { data: snapshotData } = await supabase.rpc('get_platform_snapshot');

        if (!ANTHROPIC_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const analysis = await runPmAnalysis({
            signalSummary,
            kpiBreachers: kpiBreaches ?? [],
            goals: goals ?? [],
            snapshot: snapshotData ?? {},
        });

        if (!analysis) {
            throw new Error('PM analysis returned no output');
        }

        // 5. Write top 3 recommendations as agent_tasks
        const taskInserts = analysis.recommendations.slice(0, 3).map((rec, i) => ({
            title: rec.title,
            description: `${rec.rationale} Suggested action: ${rec.suggested_action}`,
            status: 'pending',
            task_type: 'pm_recommendation',
            priority: rec.priority === 'HIGH' ? 'high' : rec.priority === 'MEDIUM' ? 'medium' : 'low',
            input_context: {
                metric_impact:    rec.metric_impact,
                rationale:        rec.rationale,
                suggested_action: rec.suggested_action,
                generated_at:     new Date().toISOString(),
                week_of:          sevenDaysAgo,
                rank:             i + 1,
            },
        }));

        const { error: insertErr } = await supabase.from('agent_tasks').insert(taskInserts);
        if (insertErr) console.warn('[pm-agent] Task insert warn:', insertErr.message);

        // 6. Write signal
        await supabase.rpc('write_signal', {
            p_event_type: 'pm.weekly_analysis_complete',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'pm-agent',
            p_data: {
                recommendations_count: analysis.recommendations.length,
                week_summary: analysis.week_summary,
            },
        }).catch(() => {});

        // 7. Telegram summary to founder
        if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
            const recLines = analysis.recommendations
                .slice(0, 3)
                .map((r, i) => {
                    const icon = r.priority === 'HIGH' ? '🔴' : r.priority === 'MEDIUM' ? '🟡' : '🟢';
                    return `${icon} *${i + 1}. ${r.title}*\n_${r.rationale}_\n→ ${r.suggested_action}`;
                })
                .join('\n\n');

            const msg = [
                `📋 *KOSMOI WEEKLY PM BRIEF*`,
                `_${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}_`,
                ``,
                `📊 ${analysis.week_summary}`,
                ``,
                `🎯 *Top 3 Recommendations This Week:*`,
                ``,
                recLines,
                ``,
                `💬 ${analysis.founder_note}`,
            ].join('\n');

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' }),
            }).catch(() => {});
        }

        console.log(`[pm-agent] ✅ Weekly analysis complete: ${analysis.recommendations.length} recommendations`);

        return new Response(JSON.stringify({
            success: true,
            week_summary: analysis.week_summary,
            recommendations: analysis.recommendations.length,
            tasks_created: taskInserts.length,
            founder_note: analysis.founder_note,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[pm-agent] Fatal:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
