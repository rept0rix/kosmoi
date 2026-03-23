// @ts-nocheck
// @version 1.0.0 — 2026-03-21
// @changelog: Sprint 5 — Executive Layer
/**
 * 🏛️ EXECUTIVE COUNCIL — C-Suite AI Agents
 *
 * Runs daily via pg_cron (08:00 ICT / 01:00 UTC).
 * Each executive agent:
 *   1. Loads context (platform snapshot + decisions + directives + goals)
 *   2. Reasons with Claude Sonnet (deep strategic thinking)
 *   3. Writes a daily report
 *   4. Issues directives to operational agents
 *
 * Executives:
 *   CEO  — Overall company direction, OKR review, strategic pivots
 *   CTO  — System health, tech debt, agent reliability, architecture
 *   CFO  — Revenue, costs, unit economics, financial health
 *   CMO  — Marketing effectiveness, brand, content, acquisition channels
 *   CRO  — Revenue optimization, pricing, conversion, churn analysis
 *
 * Cost: ~$0.10-0.20/day (5 Sonnet calls × ~1K input + 1K output tokens)
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Executive agent definitions
const EXECUTIVES = [
    {
        id: 'ceo',
        title: 'Chief Executive Officer',
        emoji: '👔',
        focus: 'company direction, OKR progress, strategic decisions, market positioning',
        systemPrompt: `You are the CEO of Kosmoi, a service marketplace platform in Koh Samui, Thailand.
Your job: Review the company's daily performance and issue strategic directives.

RESPONSIBILITIES:
- Monitor OKR/goal progress and adjust targets
- Identify strategic opportunities and threats
- Coordinate between departments via directives
- Make go/no-go decisions on initiatives

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence daily summary",
  "analysis": {
    "health_score": 0-100,
    "top_wins": ["..."],
    "top_risks": ["..."],
    "strategic_focus": "..."
  },
  "kpis": { "goal_progress_pct": 0-100, "agent_reliability_pct": 0-100, "strategic_alignment": "high/medium/low" },
  "recommendations": ["..."],
  "directives": [
    {
      "target_agent": "cortex|sales-scout|retention-agent|*",
      "directive_type": "priority_shift|strategy_change|focus|pause",
      "title": "short title",
      "description": "what to do and why",
      "parameters": {},
      "priority": 0-100,
      "ttl_hours": 24
    }
  ]
}`
    },
    {
        id: 'cto',
        title: 'Chief Technology Officer',
        emoji: '🔧',
        focus: 'system reliability, agent health, error rates, tech debt, performance',
        systemPrompt: `You are the CTO of Kosmoi, a service marketplace platform in Koh Samui, Thailand.
Your job: Monitor system health and agent reliability.

RESPONSIBILITIES:
- Track agent success rates and error patterns
- Identify system bottlenecks and failures
- Recommend technical improvements
- Issue directives for agent behavior changes

ANALYSIS FOCUS:
- Agent success rates (any below 80% needs investigation)
- Signal patterns (unusual spikes = problems)
- Error clustering (same agent failing repeatedly)
- System uptime and Cortex cycle health

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence system health summary",
  "analysis": {
    "system_health_score": 0-100,
    "agent_health": { "agent_id": { "status": "healthy|degraded|failing", "success_rate": 0-100 } },
    "error_patterns": ["..."],
    "tech_debt_items": ["..."]
  },
  "kpis": { "uptime_pct": 0-100, "avg_success_rate": 0-100, "error_count_24h": 0, "cortex_cycles_today": 0 },
  "recommendations": ["..."],
  "directives": []
}`
    },
    {
        id: 'cfo',
        title: 'Chief Financial Officer',
        emoji: '💰',
        focus: 'revenue, MRR, costs, unit economics, financial projections',
        systemPrompt: `You are the CFO of Kosmoi, a service marketplace platform in Koh Samui, Thailand.
Your job: Track financial health and optimize unit economics.

RESPONSIBILITIES:
- Monitor MRR trends and revenue health
- Track AI costs (Claude API, external APIs)
- Analyze customer lifetime value vs acquisition cost
- Flag financial risks (churn spikes, payment failures)

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence financial summary",
  "analysis": {
    "financial_health_score": 0-100,
    "revenue_trend": "growing|stable|declining",
    "cost_concerns": ["..."],
    "opportunities": ["..."]
  },
  "kpis": { "mrr_thb": 0, "churn_rate_pct": 0, "ai_cost_daily_usd": 0, "ltv_cac_ratio": 0 },
  "recommendations": ["..."],
  "directives": []
}`
    },
    {
        id: 'cmo',
        title: 'Chief Marketing Officer',
        emoji: '📢',
        focus: 'acquisition channels, brand awareness, content strategy, market positioning',
        systemPrompt: `You are the CMO of Kosmoi, a service marketplace platform in Koh Samui, Thailand.
Your job: Optimize marketing and acquisition strategy.

RESPONSIBILITIES:
- Analyze lead acquisition effectiveness
- Review outreach campaign results
- Recommend content and marketing initiatives
- Track brand metrics and market position

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence marketing summary",
  "analysis": {
    "marketing_health_score": 0-100,
    "acquisition_channels": { "channel": { "leads": 0, "conversion_pct": 0 } },
    "campaign_effectiveness": "high|medium|low",
    "brand_observations": ["..."]
  },
  "kpis": { "new_leads_7d": 0, "outreach_conversion_pct": 0, "invites_sent_7d": 0, "claimed_providers": 0 },
  "recommendations": ["..."],
  "directives": []
}`
    },
    {
        id: 'cro',
        title: 'Chief Revenue Officer',
        emoji: '📈',
        focus: 'conversion optimization, pricing, retention, revenue growth levers',
        systemPrompt: `You are the CRO of Kosmoi, a service marketplace platform in Koh Samui, Thailand.
Your job: Maximize revenue through conversion and retention optimization.

RESPONSIBILITIES:
- Analyze conversion funnels (lead → claim → trial → paid)
- Track retention and churn patterns
- Optimize pricing strategy based on data
- Identify highest-impact revenue levers

OUTPUT FORMAT (strict JSON):
{
  "summary": "1-2 sentence revenue optimization summary",
  "analysis": {
    "revenue_health_score": 0-100,
    "funnel": { "leads": 0, "claimed": 0, "trial": 0, "paid": 0 },
    "conversion_bottleneck": "...",
    "churn_analysis": "..."
  },
  "kpis": { "trial_to_paid_pct": 0, "churn_rate_pct": 0, "arpu_thb": 0, "expansion_revenue_pct": 0 },
  "recommendations": ["..."],
  "directives": []
}`
    }
];

console.log('🏛️ Executive Council starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = Date.now();
    const councilId = crypto.randomUUID();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Parse request — allow running specific executive or all
        const body = await req.json().catch(() => ({}));
        const targetExec = body.executive || 'all';  // 'all', 'ceo', 'cto', etc.
        const dryRun = body.dry_run || false;

        const execsToRun = targetExec === 'all'
            ? EXECUTIVES
            : EXECUTIVES.filter(e => e.id === targetExec);

        if (execsToRun.length === 0) {
            return respond(400, { error: `Unknown executive: ${targetExec}` });
        }

        // Signal: council session started
        await supabase.rpc('write_signal', {
            p_event_type: 'executive.council_started',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'executive-council',
            p_data: { council_id: councilId, executives: execsToRun.map(e => e.id), dry_run: dryRun }
        }).catch(() => {});

        // ================================================================
        // Load shared context (once, shared by all executives)
        // ================================================================
        const [snapshotRes, execContextRes] = await Promise.all([
            supabase.rpc('get_platform_snapshot'),
            supabase.rpc('get_executive_context', { p_agent_id: execsToRun[0].id })
        ]);

        const snapshot = snapshotRes.data || {};
        const sharedContext = execContextRes.data || {};

        // ================================================================
        // Run each executive sequentially (to manage API rate limits)
        // ================================================================
        const results = [];

        for (const exec of execsToRun) {
            console.log(`[${councilId}] ${exec.emoji} Running ${exec.title}...`);
            const execStart = Date.now();

            try {
                // Load executive-specific context
                const { data: execContext } = await supabase.rpc('get_executive_context', {
                    p_agent_id: exec.id
                });

                // Build the reasoning prompt
                const userMessage = buildExecPrompt(exec, snapshot, execContext || sharedContext);

                // Call Claude Sonnet for deep reasoning
                let report;
                if (anthropicKey && !dryRun) {
                    report = await callClaude(anthropicKey, exec.systemPrompt, userMessage);
                } else {
                    report = buildFallbackReport(exec, snapshot);
                }

                const duration_ms = Date.now() - execStart;

                // Write executive report
                await supabase.from('executive_reports').upsert({
                    agent_id: exec.id,
                    report_date: new Date().toISOString().split('T')[0],
                    report_type: 'daily',
                    summary: report.summary || 'No summary',
                    analysis: report.analysis || {},
                    recommendations: report.recommendations || [],
                    kpis: report.kpis || {},
                    directives_issued: (report.directives || []).length,
                    model_used: anthropicKey ? 'claude-sonnet-4-20250514' : 'fallback',
                    tokens_used: report._tokens || 0,
                    duration_ms
                }, { onConflict: 'agent_id,report_date,report_type' });

                // Issue directives
                let directivesCreated = 0;
                for (const directive of (report.directives || [])) {
                    if (!directive.target_agent || !directive.title) continue;

                    await supabase.from('agent_directives').insert({
                        issued_by: exec.id,
                        target_agent: directive.target_agent,
                        directive_type: directive.directive_type || 'focus',
                        title: directive.title,
                        description: directive.description || '',
                        parameters: directive.parameters || {},
                        priority: directive.priority || 50,
                        expires_at: directive.ttl_hours
                            ? new Date(Date.now() + directive.ttl_hours * 3600000).toISOString()
                            : null
                    });
                    directivesCreated++;
                }

                // Signal: executive report completed
                await supabase.rpc('write_signal', {
                    p_event_type: 'executive.report_completed',
                    p_entity_type: 'agent',
                    p_entity_id: exec.id,
                    p_source: 'executive-council',
                    p_data: {
                        council_id: councilId,
                        executive: exec.id,
                        health_score: report.analysis?.health_score ||
                                      report.analysis?.system_health_score ||
                                      report.analysis?.financial_health_score ||
                                      report.analysis?.marketing_health_score ||
                                      report.analysis?.revenue_health_score || 0,
                        directives_issued: directivesCreated,
                        duration_ms
                    }
                }).catch(() => {});

                results.push({
                    executive: exec.id,
                    title: exec.title,
                    success: true,
                    summary: report.summary,
                    directives_issued: directivesCreated,
                    duration_ms
                });

                console.log(`[${councilId}] ${exec.emoji} ✅ ${exec.id}: ${directivesCreated} directives (${duration_ms}ms)`);

            } catch (execError: any) {
                console.error(`[${councilId}] ${exec.emoji} ❌ ${exec.id}: ${execError.message}`);
                results.push({
                    executive: exec.id,
                    title: exec.title,
                    success: false,
                    error: execError.message,
                    duration_ms: Date.now() - execStart
                });
            }
        }

        // ================================================================
        // Telegram summary
        // ================================================================
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        if (telegramToken && telegramChatId) {
            const lines = results.map(r =>
                `${r.success ? '✅' : '❌'} *${r.executive.toUpperCase()}*: ${r.success ? r.summary?.substring(0, 80) : r.error?.substring(0, 80)} (${r.directives_issued || 0} directives)`
            );

            const msg = [
                `🏛️ *EXECUTIVE COUNCIL — Daily Session*`,
                `📅 ${new Date().toISOString().split('T')[0]}`,
                ``,
                ...lines,
                ``,
                `⏱ Total: ${Date.now() - startTime}ms`
            ].join('\n');

            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'Markdown' })
            }).catch(() => {});
        }

        // Signal: council session completed
        await supabase.rpc('write_signal', {
            p_event_type: 'executive.council_completed',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'executive-council',
            p_data: {
                council_id: councilId,
                executives_run: results.length,
                executives_succeeded: results.filter(r => r.success).length,
                total_directives: results.reduce((sum, r) => sum + (r.directives_issued || 0), 0),
                duration_ms: Date.now() - startTime
            }
        }).catch(() => {});

        return respond(200, {
            status: 'OK',
            council_id: councilId,
            executives: results,
            total_duration_ms: Date.now() - startTime
        });

    } catch (error: any) {
        console.error(`[${councilId}] 💥 Executive Council failed:`, error.message);
        return respond(500, { error: error.message, council_id: councilId });
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
function buildExecPrompt(exec: any, snapshot: any, context: any): string {
    return `Today: ${new Date().toISOString().split('T')[0]}
Executive: ${exec.title} (${exec.id})
Focus areas: ${exec.focus}

PLATFORM SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

RECENT AGENT DECISIONS (24h):
${JSON.stringify(context.recent_decisions || [], null, 2)}

ACTIVE DIRECTIVES:
${JSON.stringify(context.active_directives || [], null, 2)}

COMPANY GOALS:
${JSON.stringify(context.company_goals || [], null, 2)}

YOUR PREVIOUS REPORTS:
${JSON.stringify(context.recent_reports || [], null, 2)}

AGENT PERFORMANCE (7d):
${JSON.stringify(context.agent_performance || [], null, 2)}

SIGNAL SUMMARY (24h):
${JSON.stringify(context.signal_summary || [], null, 2)}

Based on all the above data, provide your daily ${exec.id.toUpperCase()} report.
Include specific, actionable directives if any operational changes are needed.
If things are running well, say so — don't force unnecessary directives.`;
}

// ================================================================
// CLAUDE API CALL
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
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
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
    const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude returned non-JSON response');

    const parsed = JSON.parse(jsonMatch[0]);
    parsed._tokens = tokens;
    return parsed;
}

// ================================================================
// FALLBACK REPORTS (when Claude unavailable)
// ================================================================
function buildFallbackReport(exec: any, snapshot: any): any {
    const base = {
        summary: `${exec.title} daily report (fallback mode — no Claude API key)`,
        analysis: { health_score: 50, note: 'Fallback mode — manual review recommended' },
        kpis: {},
        recommendations: ['Configure ANTHROPIC_API_KEY for AI-powered executive analysis'],
        directives: [],
        _tokens: 0
    };

    // Add role-specific KPIs from snapshot
    switch (exec.id) {
        case 'ceo':
            base.kpis = {
                goal_progress_pct: 0,
                agent_reliability_pct: snapshot.health?.agent_success_rate || 0,
                strategic_alignment: 'unknown'
            };
            break;
        case 'cto':
            base.kpis = {
                uptime_pct: 100,
                avg_success_rate: snapshot.health?.agent_success_rate || 0,
                error_count_24h: 0,
                cortex_cycles_today: snapshot.brain?.cycles_today || 0
            };
            break;
        case 'cfo':
            base.kpis = {
                mrr_thb: snapshot.health?.mrr_thb || 0,
                churn_rate_pct: 0,
                ai_cost_daily_usd: 0.15,
                ltv_cac_ratio: 0
            };
            break;
        case 'cmo':
            base.kpis = {
                new_leads_7d: 0,
                outreach_conversion_pct: 0,
                invites_sent_7d: snapshot.pipeline?.invites_sent_7d || 0,
                claimed_providers: snapshot.health?.claimed_providers || 0
            };
            break;
        case 'cro':
            base.kpis = {
                trial_to_paid_pct: 0,
                churn_rate_pct: 0,
                arpu_thb: 0,
                expansion_revenue_pct: 0
            };
            break;
    }

    return base;
}
