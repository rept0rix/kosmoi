// ================================================================
// HR REVIEW — Agent Performance Evaluator
//
// Reviews all active agents, grades their performance, and
// recommends actions (keep, retrain, optimize, disable).
//
// Schedule: Daily (via Cortex or pg_cron)
// Output: agent_reviews rows + signals
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
    // ── Gather data for all active agents ───────────────
    const { data: roster } = await supabase
      .from('agent_roster')
      .select('*')
      .eq('status', 'active');

    if (!roster?.length) {
      return jsonResponse({ ok: true, message: 'No active agents to review' });
    }

    const period = new Date().toISOString().split('T')[0];

    // Get 7-day performance data per agent
    const agentStats: Record<string, any> = {};
    for (const agent of roster) {
      const [decisions, costs] = await Promise.all([
        supabase
          .from('agent_decisions')
          .select('outcome, created_at')
          .eq('agent_id', agent.agent_id)
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase
          .from('ai_cost_log')
          .select('cost_usd, latency_ms')
          .eq('agent_id', agent.agent_id)
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      ]);

      const decs = decisions.data || [];
      const costData = costs.data || [];
      const successCount = decs.filter((d: any) => d.outcome === 'success').length;

      agentStats[agent.agent_id] = {
        ...agent,
        decisions_count: decs.length,
        success_rate: decs.length > 0 ? Math.round((successCount / decs.length) * 100) : null,
        total_cost: costData.reduce((s: number, c: any) => s + (c.cost_usd || 0), 0),
        avg_latency: costData.length > 0
          ? Math.round(costData.reduce((s: number, c: any) => s + (c.latency_ms || 0), 0) / costData.length)
          : null,
      };
    }

    // ── Review with Claude or fallback ──────────────────
    let reviews: any[];

    if (apiKey) {
      reviews = await reviewWithClaude(apiKey, agentStats, period);
    } else {
      reviews = reviewFallback(agentStats, period);
    }

    // ── Save reviews ────────────────────────────────────
    let saved = 0;
    for (const review of reviews) {
      const { error } = await supabase.from('agent_reviews').insert(review);
      if (!error) saved++;
    }

    // Signal escalations for underperformers
    const underperformers = reviews.filter(r => r.grade === 'D' || r.grade === 'F');
    if (underperformers.length > 0) {
      sig('hr.underperformers_detected', 'hr-agent', {
        count: underperformers.length,
        agents: underperformers.map(u => ({
          agent_id: u.agent_id,
          grade: u.grade,
          recommendation: u.recommendation,
        })),
      });
    }

    sig('hr.review_completed', 'hr-agent', {
      agents_reviewed: saved,
      grades: reviews.reduce((acc: any, r: any) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {}),
      underperformers: underperformers.length,
      duration_ms: Date.now() - startMs,
    });

    // Log AI cost
    if (apiKey) {
      await supabase.rpc('log_ai_cost', {
        p_agent_id: 'hr-agent',
        p_edge_function: 'hr-review',
        p_model: 'claude-haiku-4-5-20251001',
        p_input_tokens: 1500,
        p_output_tokens: 800,
        p_cost_usd: 0.0055,
        p_purpose: 'agent_performance_review',
        p_latency_ms: Date.now() - startMs,
      }).catch(() => {});
    }

    return jsonResponse({
      ok: true,
      agents_reviewed: saved,
      underperformers: underperformers.length,
      duration_ms: Date.now() - startMs,
    });

  } catch (err) {
    sig('hr.error', 'hr-agent', { error: (err as Error).message });
    return jsonResponse({ ok: false, error: (err as Error).message }, 500);
  }
});

async function reviewWithClaude(apiKey: string, stats: Record<string, any>, period: string) {
  const systemPrompt = `You are an HR Agent reviewing AI agent performance for an autonomous company.

For each agent, assign:
- grade: A (excellent), B (good), C (adequate), D (underperforming), F (failing)
- strengths: array of positive notes
- weaknesses: array of concerns
- recommendation: 'keep' | 'retrain' | 'optimize' | 'disable' | 'promote'
- reasoning: 1-2 sentence justification

Grading criteria:
- Success rate > 90% → A or B
- Success rate 70-90% → B or C
- Success rate < 70% → D or F
- No activity in 7 days for scheduled agents → D
- High cost relative to value → consider 'optimize'
- Consistently failing → recommend 'disable'

Output JSON array: [{ "agent_id": "...", "grade": "...", "strengths": [...], "weaknesses": [...], "recommendation": "...", "reasoning": "..." }]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Review period: ${period}\n\nAgent Performance Data:\n${JSON.stringify(stats, null, 2)}`,
      }],
    }),
  });

  const result = await response.json();
  const text = result.content?.[0]?.text || '[]';

  let parsed: any[];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    parsed = match ? JSON.parse(match[0]) : [];
  } catch {
    parsed = [];
  }

  return parsed.map((r: any) => ({
    agent_id: r.agent_id,
    reviewer: 'hr-agent',
    period,
    decisions_count: stats[r.agent_id]?.decisions_count || 0,
    success_rate: stats[r.agent_id]?.success_rate,
    avg_latency_ms: stats[r.agent_id]?.avg_latency,
    cost_usd: stats[r.agent_id]?.total_cost || 0,
    grade: r.grade || 'C',
    strengths: r.strengths || [],
    weaknesses: r.weaknesses || [],
    recommendation: r.recommendation || 'keep',
    reasoning: r.reasoning || 'Auto-reviewed',
  }));
}

function reviewFallback(stats: Record<string, any>, period: string) {
  return Object.entries(stats).map(([agentId, s]) => {
    let grade = 'C';
    let recommendation = 'keep';

    if (s.success_rate === null && s.decisions_count === 0) {
      grade = 'D';
      recommendation = 'optimize';
    } else if (s.success_rate >= 90) {
      grade = 'A';
    } else if (s.success_rate >= 75) {
      grade = 'B';
    } else if (s.success_rate >= 50) {
      grade = 'C';
      recommendation = 'retrain';
    } else {
      grade = 'F';
      recommendation = 'disable';
    }

    return {
      agent_id: agentId,
      reviewer: 'hr-agent',
      period,
      decisions_count: s.decisions_count,
      success_rate: s.success_rate,
      avg_latency_ms: s.avg_latency,
      cost_usd: s.total_cost || 0,
      grade,
      strengths: s.success_rate >= 80 ? ['High success rate'] : [],
      weaknesses: s.success_rate !== null && s.success_rate < 60 ? ['Low success rate'] : [],
      recommendation,
      reasoning: `Fallback review: ${s.decisions_count} decisions, ${s.success_rate ?? 'N/A'}% success`,
    };
  });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
