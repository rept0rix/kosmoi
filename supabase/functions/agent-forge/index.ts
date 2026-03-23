// ================================================================
// THE FORGE — Agent Factory Edge Function
//
// Analyzes company gaps and proposes new agents or capabilities.
// Uses Claude Sonnet (smarter model) because this is high-stakes.
// CANNOT create agents directly — only proposes. God approves.
//
// Schedule: Daily (via Cortex directive)
// Output: evolution_proposals rows + signals
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sigWriter(supabase: any) {
  return (eventType: string, entityId: string, data: Record<string, any>) => {
    supabase.rpc('write_signal', {
      p_event_type: eventType, p_entity_id: entityId, p_data: data,
    }).catch(() => {});
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startMs = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const sig = sigWriter(supabase);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  try {
    // ── Gather context ──────────────────────────────────
    const [rosterRes, reviewsRes, goalsRes, intelRes, proposalsRes, snapshotRes] = await Promise.all([
      supabase.from('agent_roster').select('*').eq('status', 'active'),
      supabase.from('agent_reviews').select('agent_id, grade, recommendation, reasoning')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('company_goals').select('*').eq('status', 'active'),
      supabase.from('competitive_intel').select('competitor_name, intel_type, severity, summary')
        .eq('response_status', 'pending').limit(10),
      supabase.from('evolution_proposals').select('title, status')
        .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
      supabase.rpc('get_platform_snapshot'),
    ]);

    const roster = rosterRes.data || [];
    const reviews = reviewsRes.data || [];
    const goals = goalsRes.data || [];
    const intel = intelRes.data || [];
    const existingProposals = proposalsRes.data || [];
    const snapshot = snapshotRes.data || {};

    if (!apiKey) {
      // Fallback: no proposals without AI — this needs deep reasoning
      sig('forge.skipped', 'the-forge', { reason: 'No API key — Forge requires Claude' });
      return jsonResponse({ ok: true, mode: 'skipped', reason: 'API key required' });
    }

    // ── Analyze with Claude Sonnet ──────────────────────
    const systemPrompt = `You are The Forge — the agent factory for an autonomous AI company.

Your job: analyze the company's current state and propose improvements.

Current org: ${roster.length} agents across ${new Set(roster.map((r: any) => r.department)).size} departments.

You can propose:
1. **create_agent** — a new agent the company needs
2. **modify_agent** — changes to an existing agent's capabilities or schedule
3. **disable_agent** — remove an underperforming agent
4. **new_capability** — add a new capability to an existing agent
5. **new_workflow** — propose a new cross-agent workflow

RULES:
- Maximum 2 proposals per run (quality > quantity)
- Don't propose agents that already exist
- Don't repeat proposals made in the last 14 days
- Every proposal MUST have clear ROI justification
- Proposals need admin approval — make them convincing
- Risk level: 'low' for read-only, 'medium' for writes, 'high' for external, 'critical' for destructive

Output JSON array of proposals:
[{
  "proposal_type": "create_agent|modify_agent|disable_agent|new_capability|new_workflow",
  "title": "Short descriptive title",
  "description": "What this does and why",
  "reasoning": "Data-driven justification",
  "expected_impact": "high|medium|low",
  "estimated_daily_cost": 0.05,
  "risk_level": "low|medium|high|critical",
  "target_agent_id": "optional — for modify/disable",
  "agent_spec": {
    "agent_id": "new-agent-name",
    "display_name": "New Agent",
    "role": "specialist",
    "department": "marketing",
    "reports_to": "cmo",
    "avatar_emoji": "🆕",
    "schedule": "daily",
    "capabilities": ["claude_api", "db_write"],
    "system_prompt_summary": "What this agent does"
  }
}]

If the company is running well and no improvements needed, return empty array [].`;

    const userMessage = `## Current Agent Roster
${roster.map((a: any) => `- ${a.avatar_emoji} ${a.display_name} (${a.role}, ${a.department}, ${a.schedule})`).join('\n')}

## Recent HR Reviews
${reviews.map((r: any) => `- ${r.agent_id}: Grade ${r.grade}, Recommendation: ${r.recommendation}. ${r.reasoning}`).join('\n')}

## Company Goals
${goals.map((g: any) => `- ${g.title}: ${g.current_value}/${g.target_value}`).join('\n')}

## Pending Competitive Intel
${intel.map((i: any) => `- [${i.severity}] ${i.competitor_name}: ${i.summary}`).join('\n')}

## Platform Snapshot
${JSON.stringify(snapshot, null, 2)}

## Recent Proposals (don't repeat)
${existingProposals.map((p: any) => `- [${p.status}] ${p.title}`).join('\n')}

Analyze and propose improvements (max 2):`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API ${response.status}`);

    const result = await response.json();
    const text = result.content?.[0]?.text || '[]';
    const tokensUsed = (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);

    let proposals: any[];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      proposals = match ? JSON.parse(match[0]) : [];
    } catch {
      proposals = [];
    }

    // ── Save proposals ──────────────────────────────────
    let saved = 0;
    for (const p of proposals.slice(0, 2)) {
      const { error } = await supabase.from('evolution_proposals').insert({
        proposal_type: p.proposal_type || 'new_capability',
        title: p.title || 'Untitled proposal',
        description: p.description || '',
        proposed_by: 'the-forge',
        agent_spec: p.agent_spec || null,
        target_agent_id: p.target_agent_id || null,
        modifications: p.modifications || null,
        reasoning: p.reasoning || '',
        expected_impact: p.expected_impact || 'medium',
        estimated_daily_cost: p.estimated_daily_cost || 0,
        risk_level: p.risk_level || 'low',
      });
      if (!error) saved++;
    }

    sig('forge.proposals_created', 'the-forge', {
      proposals_count: saved,
      titles: proposals.map((p: any) => p.title),
      tokens_used: tokensUsed,
      duration_ms: Date.now() - startMs,
    });

    // Log cost (Sonnet is more expensive)
    const costUsd = (result.usage?.input_tokens || 0) * 0.003 / 1000
                  + (result.usage?.output_tokens || 0) * 0.015 / 1000;
    await supabase.rpc('log_ai_cost', {
      p_agent_id: 'the-forge',
      p_edge_function: 'agent-forge',
      p_model: 'claude-sonnet-4-20250514',
      p_input_tokens: result.usage?.input_tokens || 0,
      p_output_tokens: result.usage?.output_tokens || 0,
      p_cost_usd: costUsd,
      p_purpose: 'evolution_analysis',
      p_latency_ms: Date.now() - startMs,
    }).catch(() => {});

    return jsonResponse({
      ok: true,
      proposals_created: saved,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      duration_ms: Date.now() - startMs,
    });

  } catch (err) {
    sig('forge.error', 'the-forge', { error: (err as Error).message });
    return jsonResponse({ ok: false, error: (err as Error).message }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
