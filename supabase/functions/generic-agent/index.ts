// ================================================================
// GENERIC AGENT RUNNER — One Edge Function to rule them all
//
// Instead of 68 separate Edge Functions, this single runner
// can impersonate ANY agent by loading its system_prompt and
// config from agent_roster.
//
// Usage: POST { agent_id: "lead-scorer", context: {...} }
// The runner loads the agent's personality, observes relevant
// data, reasons with Claude, and writes decisions/signals.
//
// This is how you scale from 19 → 68+ agents without 68 files.
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-sonnet-4-20250514', // fallback to sonnet
};

const MODEL_COST: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.001, output: 0.005 },   // per 1K tokens
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
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
    const body = await req.json().catch(() => ({}));
    const { agent_id, context = {}, task } = body;

    if (!agent_id) {
      return jsonResponse({ ok: false, error: 'agent_id required' }, 400);
    }

    // ── Load agent config from roster ───────────────────
    const { data: agent, error: agentErr } = await supabase
      .from('agent_roster')
      .select('*')
      .eq('agent_id', agent_id)
      .single();

    if (agentErr || !agent) {
      return jsonResponse({ ok: false, error: `Agent not found: ${agent_id}` }, 404);
    }

    if (agent.status !== 'active') {
      return jsonResponse({ ok: false, error: `Agent ${agent_id} is ${agent.status}` }, 403);
    }

    if (!agent.system_prompt) {
      return jsonResponse({ ok: false, error: `Agent ${agent_id} has no system prompt` }, 500);
    }

    // ── Load agent's boot context ───────────────────────
    const { data: bootContext } = await supabase.rpc('get_agent_boot_context', {
      p_agent_id: agent_id,
    });

    // ── Load relevant platform data ─────────────────────
    const { data: snapshot } = await supabase.rpc('get_platform_snapshot');

    // Load recent signals relevant to this agent's department
    const { data: recentSignals } = await supabase
      .from('signals')
      .select('event_type, data, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(15);

    // ── Reason with Claude ──────────────────────────────
    if (!apiKey) {
      // No API key — log a "dry run" decision
      await supabase.from('agent_decisions').insert({
        agent_id,
        decision_type: `${agent_id}_analysis`,
        action_type: 'dry_run',
        reasoning: 'No API key available — agent ran in dry-run mode',
        success: true,
        result: { mode: 'dry_run' },
      });

      sig(`agent.dry_run`, agent_id, { reason: 'no_api_key' });
      return jsonResponse({ ok: true, mode: 'dry_run', agent_id });
    }

    const model = MODEL_MAP[agent.model_tier] || MODEL_MAP.haiku;

    const systemPrompt = `${agent.system_prompt}

You work for an autonomous AI company operating a service marketplace in Koh Samui, Thailand.
Your department: ${agent.department || 'general'}
You report to: ${agent.reports_to || 'CEO'}

Based on the data provided, analyze the situation and recommend actions.

Output JSON:
{
  "analysis": "Your 2-3 sentence analysis of the current situation",
  "findings": [
    { "type": "insight|concern|opportunity|metric", "text": "Description", "severity": "low|medium|high" }
  ],
  "recommended_actions": [
    { "action": "what to do", "target": "who/what to target", "priority": "low|medium|high", "reason": "why" }
  ]
}`;

    const userMessage = [
      task ? `## Task\n${task}\n` : '',
      `## Platform Snapshot\n${JSON.stringify(snapshot, null, 2)}\n`,
      `## Recent Signals\n${(recentSignals || []).map(s => `- ${s.event_type}: ${JSON.stringify(s.data)}`).join('\n')}\n`,
      bootContext?.working_memory ? `## Your Memory\n${JSON.stringify(bootContext.working_memory, null, 2)}\n` : '',
      Object.keys(context).length > 0 ? `## Additional Context\n${JSON.stringify(context, null, 2)}` : '',
    ].filter(Boolean).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API ${response.status}`);

    const claudeResult = await response.json();
    const rawText = claudeResult.content?.[0]?.text || '';
    const inputTokens = claudeResult.usage?.input_tokens || 0;
    const outputTokens = claudeResult.usage?.output_tokens || 0;

    // Parse response
    let parsed: any;
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { analysis: rawText, findings: [], recommended_actions: [] };
    } catch {
      parsed = { analysis: rawText, findings: [], recommended_actions: [] };
    }

    // ── Save decision ───────────────────────────────────
    await supabase.from('agent_decisions').insert({
      agent_id,
      decision_type: `${agent_id}_analysis`,
      action_type: 'analysis',
      reasoning: parsed.analysis || 'No analysis',
      success: true,
      outcome: 'success',
      result: {
        findings: parsed.findings || [],
        recommended_actions: parsed.recommended_actions || [],
        model,
        tokens: inputTokens + outputTokens,
      },
    });

    // Save memory
    await supabase.rpc('upsert_agent_memory', {
      p_agent_id: agent_id,
      p_key: 'last_analysis',
      p_value: {
        analysis: parsed.analysis,
        findings_count: parsed.findings?.length || 0,
        actions_count: parsed.recommended_actions?.length || 0,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    // Signal high-priority findings
    const highFindings = (parsed.findings || []).filter((f: any) => f.severity === 'high');
    if (highFindings.length > 0) {
      sig(`agent.high_priority_finding`, agent_id, {
        findings: highFindings,
        department: agent.department,
      });
    }

    // ── Log cost ────────────────────────────────────────
    const costs = MODEL_COST[model] || MODEL_COST['claude-haiku-4-5-20251001'];
    const costUsd = (inputTokens * costs.input / 1000) + (outputTokens * costs.output / 1000);

    await supabase.rpc('log_ai_cost', {
      p_agent_id: agent_id,
      p_edge_function: 'generic-agent',
      p_model: model,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_cost_usd: costUsd,
      p_purpose: `${agent_id}_analysis`,
      p_latency_ms: Date.now() - startMs,
    }).catch(() => {});

    sig(`agent.completed`, agent_id, {
      findings: parsed.findings?.length || 0,
      actions: parsed.recommended_actions?.length || 0,
      cost_usd: costUsd,
      duration_ms: Date.now() - startMs,
    });

    return jsonResponse({
      ok: true,
      agent_id,
      model,
      analysis: parsed.analysis,
      findings: parsed.findings?.length || 0,
      recommended_actions: parsed.recommended_actions?.length || 0,
      cost_usd: costUsd,
      duration_ms: Date.now() - startMs,
    });

  } catch (err) {
    sig('agent.error', body?.agent_id || 'unknown', { error: (err as Error).message });
    return jsonResponse({ ok: false, error: (err as Error).message }, 500);
  }
});

let body: any;

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
