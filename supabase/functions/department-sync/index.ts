// @ts-nocheck
// @version 1.0.0 — 2026-03-21
// @changelog: Sprint 6 — Department Heads
/**
 * 🏢 DEPARTMENT SYNC — Mid-Level Management AI
 *
 * Runs every 4 hours via pg_cron.
 * Each department head:
 *   1. Reviews team performance (last 4h of agent_decisions)
 *   2. Reads executive directives relevant to their department
 *   3. Reasons about team coordination (Claude Haiku)
 *   4. Issues micro-directives to team members
 *   5. Escalates issues to executives
 *   6. Writes department report
 *
 * Departments:
 *   Sales (sales-head)  — coordinates sales-scout + sales-outreach
 *   Operations (ops-head) — coordinates retention + payment-recovery + support-router
 *
 * Cost: ~$0.05/day (12 Haiku calls × ~500 tokens each)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEPARTMENTS = [
    {
        id: 'sales',
        headId: 'sales-head',
        emoji: '🎯',
        title: 'Sales Department',
        agents: ['sales-scout', 'sales-outreach'],
        systemPrompt: `You are the VP of Sales at Kosmoi, a service marketplace in Koh Samui, Thailand.
You manage sales-scout (discovers leads) and sales-outreach (sends personalized outreach).

YOUR JOB: Review team performance and optimize the sales pipeline.

AVAILABLE MICRO-DIRECTIVES (issue to your team):
- { target: "sales-scout", type: "increase_volume", params: { factor: 1.5 }, reason: "..." }
- { target: "sales-scout", type: "change_focus", params: { categories: ["spa", "fitness"] }, reason: "..." }
- { target: "sales-outreach", type: "adjust_timing", params: { preferred_hours: [9,14] }, reason: "..." }
- { target: "sales-outreach", type: "change_template", params: { tone: "personal|professional" }, reason: "..." }
- { target: "cortex", type: "escalation", params: { issue: "..." }, reason: "..." }

RULES:
1. If the team is performing well (>80% success rate), don't change anything.
2. Focus on pipeline metrics: leads discovered, invites sent, conversions.
3. Escalate to executives only for strategic issues, not operational ones.

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence department status",
  "team_performance": {
    "agent_id": { "status": "performing|struggling|idle", "success_rate": 0-100, "notes": "..." }
  },
  "metrics": { "leads_discovered_4h": 0, "invites_sent_4h": 0, "conversion_rate_pct": 0 },
  "micro_directives": [{ "target": "...", "type": "...", "params": {}, "reason": "...", "ttl_hours": 4 }],
  "escalations": [{ "to": "cro|ceo", "issue": "...", "severity": "low|medium|high" }]
}`
    },
    {
        id: 'operations',
        headId: 'ops-head',
        emoji: '⚙️',
        title: 'Operations Department',
        agents: ['retention-agent', 'payment-recovery', 'support-router'],
        systemPrompt: `You are the VP of Operations at Kosmoi, a service marketplace in Koh Samui, Thailand.
You manage retention-agent, payment-recovery, and support-router.

YOUR JOB: Keep the platform running smoothly — prevent churn, recover payments, resolve support issues.

AVAILABLE MICRO-DIRECTIVES:
- { target: "retention-agent", type: "focus_segment", params: { segment: "trial|paid|churned" }, reason: "..." }
- { target: "retention-agent", type: "urgency_boost", params: { priority: "high" }, reason: "..." }
- { target: "payment-recovery", type: "retry_strategy", params: { max_retries: 3, delay_hours: 24 }, reason: "..." }
- { target: "support-router", type: "auto_resolve_threshold", params: { confidence: 0.8 }, reason: "..." }
- { target: "cortex", type: "escalation", params: { issue: "..." }, reason: "..." }

RULES:
1. Prioritize: churn prevention > payment recovery > support resolution.
2. If a team member has 0 actions in 4 hours and there's work to do, flag it.
3. Escalate to CTO for system issues, CRO for revenue issues.

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence department status",
  "team_performance": {
    "agent_id": { "status": "performing|struggling|idle", "success_rate": 0-100, "notes": "..." }
  },
  "metrics": { "churn_prevented_4h": 0, "payments_recovered_4h": 0, "tickets_resolved_4h": 0 },
  "micro_directives": [{ "target": "...", "type": "...", "params": {}, "reason": "...", "ttl_hours": 4 }],
  "escalations": [{ "to": "cto|cro", "issue": "...", "severity": "low|medium|high" }]
}`
    }
];

console.log('🏢 Department Sync starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();
    const syncId = crypto.randomUUID();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json().catch(() => ({}));
        const targetDept = body.department || 'all';
        const dryRun = body.dry_run || false;

        const deptsToRun = targetDept === 'all'
            ? DEPARTMENTS
            : DEPARTMENTS.filter(d => d.id === targetDept);

        // Signal: sync started
        await supabase.rpc('write_signal', {
            p_event_type: 'department.sync_started',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'department-sync',
            p_data: { sync_id: syncId, departments: deptsToRun.map(d => d.id), dry_run: dryRun }
        }).catch(() => {});

        // Load platform snapshot (shared)
        const { data: snapshot } = await supabase.rpc('get_platform_snapshot').catch(() => ({ data: {} }));

        const results = [];

        for (const dept of deptsToRun) {
            console.log(`[${syncId}] ${dept.emoji} Running ${dept.title}...`);
            const deptStart = Date.now();

            try {
                // Load department context
                const { data: context } = await supabase.rpc('get_department_context', {
                    p_department: dept.id,
                    p_head_agent_id: dept.headId
                });

                // Build reasoning prompt
                const userMessage = buildDeptPrompt(dept, snapshot || {}, context || {});

                // Reason with Claude Haiku (fast + cheap for mid-level decisions)
                let report;
                if (anthropicKey && !dryRun) {
                    report = await callClaude(anthropicKey, dept.systemPrompt, userMessage);
                } else {
                    report = buildFallbackReport(dept, context);
                }

                const duration_ms = Date.now() - deptStart;
                const reportPeriod = new Date().toISOString().substring(0, 13) + ':00'; // hourly block

                // Write department report
                await supabase.from('department_reports').upsert({
                    department: dept.id,
                    head_agent_id: dept.headId,
                    report_period: reportPeriod,
                    summary: report.summary || 'No summary',
                    team_performance: report.team_performance || {},
                    metrics: report.metrics || {},
                    micro_directives: report.micro_directives || [],
                    escalations: report.escalations || [],
                    model_used: anthropicKey ? 'claude-haiku-4-5-20251001' : 'fallback',
                    duration_ms
                }, { onConflict: 'department,report_period' });

                // Issue micro-directives
                let directivesIssued = 0;
                for (const md of (report.micro_directives || [])) {
                    if (!md.target || !md.type) continue;

                    await supabase.from('agent_directives').insert({
                        issued_by: dept.headId,
                        target_agent: md.target,
                        directive_type: md.type,
                        title: `[${dept.id.toUpperCase()}] ${md.type}`,
                        description: md.reason || '',
                        parameters: md.params || {},
                        priority: md.priority || 40,
                        expires_at: md.ttl_hours
                            ? new Date(Date.now() + (md.ttl_hours || 4) * 3600000).toISOString()
                            : new Date(Date.now() + 4 * 3600000).toISOString() // default 4h TTL
                    });
                    directivesIssued++;
                }

                // Handle escalations → write as high-priority signals
                for (const esc of (report.escalations || [])) {
                    await supabase.rpc('write_signal', {
                        p_event_type: `department.escalation`,
                        p_entity_type: 'department',
                        p_entity_id: dept.id,
                        p_source: dept.headId,
                        p_data: {
                            to: esc.to,
                            issue: esc.issue,
                            severity: esc.severity,
                            department: dept.id
                        }
                    }).catch(() => {});
                }

                // Signal: department sync completed
                await supabase.rpc('write_signal', {
                    p_event_type: 'department.sync_completed',
                    p_entity_type: 'department',
                    p_entity_id: dept.id,
                    p_source: dept.headId,
                    p_data: {
                        sync_id: syncId,
                        directives_issued: directivesIssued,
                        escalations: (report.escalations || []).length,
                        duration_ms
                    }
                }).catch(() => {});

                results.push({
                    department: dept.id,
                    head: dept.headId,
                    success: true,
                    summary: report.summary,
                    directives_issued: directivesIssued,
                    escalations: (report.escalations || []).length,
                    duration_ms
                });

                console.log(`[${syncId}] ${dept.emoji} ✅ ${dept.id}: ${directivesIssued} directives, ${(report.escalations || []).length} escalations (${duration_ms}ms)`);

            } catch (deptError: any) {
                console.error(`[${syncId}] ${dept.emoji} ❌ ${dept.id}: ${deptError.message}`);
                results.push({
                    department: dept.id,
                    head: dept.headId,
                    success: false,
                    error: deptError.message,
                    duration_ms: Date.now() - deptStart
                });
            }
        }

        // Telegram notification
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        if (telegramToken && telegramChatId) {
            const lines = results.map(r =>
                `${r.success ? '✅' : '❌'} *${r.department.toUpperCase()}*: ${r.success ? r.summary?.substring(0, 60) : r.error?.substring(0, 60)}`
            );

            const msg = [
                `🏢 *DEPARTMENT SYNC*`,
                ...lines,
                `⏱ ${Date.now() - startTime}ms`
            ].join('\n');

            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'Markdown' })
            }).catch(() => {});
        }

        return respond(200, {
            status: 'OK',
            sync_id: syncId,
            departments: results,
            total_duration_ms: Date.now() - startTime
        });

    } catch (error: any) {
        console.error(`[${syncId}] 💥 Department Sync failed:`, error.message);
        return respond(500, { error: error.message, sync_id: syncId });
    }

    function respond(status: number, body: object) {
        return new Response(JSON.stringify(body), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status
        });
    }
});

// ================================================================
// PROMPT BUILDER
// ================================================================
function buildDeptPrompt(dept: any, snapshot: any, context: any): string {
    return `Department: ${dept.title} (${dept.id})
Head: ${dept.headId}
Team: ${dept.agents.join(', ')}
Time: ${new Date().toISOString()}

PLATFORM SNAPSHOT:
MRR: ${snapshot.health?.mrr_thb || 0}฿
Claimed Providers: ${snapshot.health?.claimed_providers || 0}
Alerts: ${snapshot.alert_count || 0}

TEAM MEMBERS:
${JSON.stringify(context.team_members || [], null, 2)}

TEAM DECISIONS (last 4h):
${JSON.stringify(context.team_decisions || [], null, 2)}

EXECUTIVE DIRECTIVES FOR YOUR DEPARTMENT:
${JSON.stringify(context.active_directives || [], null, 2)}

RECENT SIGNALS FROM YOUR TEAM:
${JSON.stringify(context.recent_signals || [], null, 2)}

LAST DEPARTMENT REPORT:
${JSON.stringify(context.last_report || {}, null, 2)}

Review your team's performance and provide your department report.
Issue micro-directives only if needed. Escalate only significant issues.`;
}

// ================================================================
// CLAUDE API CALL (Haiku for speed)
// ================================================================
async function callClaude(apiKey: string, systemPrompt: string, userMessage: string): Promise<any> {
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude returned non-JSON response');

    return JSON.parse(jsonMatch[0]);
}

// ================================================================
// FALLBACK REPORT
// ================================================================
function buildFallbackReport(dept: any, context: any): any {
    const decisions = context?.team_decisions || [];
    const total = decisions.length;
    const succeeded = decisions.filter((d: any) => d.success).length;

    const teamPerf: any = {};
    for (const agentId of dept.agents) {
        const agentDecisions = decisions.filter((d: any) => d.agent_id === agentId);
        const agentSuccess = agentDecisions.filter((d: any) => d.success).length;
        teamPerf[agentId] = {
            status: agentDecisions.length === 0 ? 'idle' : (agentSuccess / agentDecisions.length >= 0.8 ? 'performing' : 'struggling'),
            success_rate: agentDecisions.length > 0 ? Math.round(agentSuccess / agentDecisions.length * 100) : 0,
            notes: `${agentDecisions.length} actions in last 4h`
        };
    }

    return {
        summary: `${dept.title} fallback report: ${total} team actions (${succeeded} succeeded). Configure ANTHROPIC_API_KEY for AI analysis.`,
        team_performance: teamPerf,
        metrics: { total_actions_4h: total, success_rate_pct: total > 0 ? Math.round(succeeded / total * 100) : 0 },
        micro_directives: [],
        escalations: []
    };
}
