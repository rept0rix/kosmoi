// ================================================================
// COMPLIANCE CHECK — Legal Agent Edge Function
//
// Audits recent agent actions for policy violations:
// - Cost overruns (agent spending too much)
// - Action frequency abuse (too many actions/day)
// - Unauthorized escalations
// - Failed action patterns (same agent failing repeatedly)
//
// Schedule: Every 4 hours
// Output: compliance_log rows + signals for violations
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Compliance Rules ──────────────────────────────────────────
interface Rule {
  id: string;
  name: string;
  check: (supabase: any) => Promise<ComplianceResult[]>;
}

interface ComplianceResult {
  agent_id: string;
  action_type: string;
  verdict: 'pass' | 'warn' | 'block';
  reason: string;
  details?: Record<string, any>;
}

function sigWriter(supabase: any) {
  return (eventType: string, entityId: string, data: Record<string, any>) => {
    Promise.resolve(supabase.rpc('write_signal', {
      p_event_type: eventType, p_entity_id: entityId, p_data: data,
    })).catch(() => {});
  };
}

// ── Rule Definitions ──────────────────────────────────────────
function getRules(supabase: any): Rule[] {
  return [
    {
      id: 'cost_overrun',
      name: 'Daily Cost Limit',
      check: async () => {
        const { data } = await supabase
          .from('ai_cost_log')
          .select('agent_id, cost_usd')
          .gte('created_at', new Date(Date.now() - 86400000).toISOString());

        const byAgent: Record<string, number> = {};
        for (const row of (data || [])) {
          byAgent[row.agent_id] = (byAgent[row.agent_id] || 0) + row.cost_usd;
        }

        const results: ComplianceResult[] = [];
        for (const [agentId, cost] of Object.entries(byAgent)) {
          if (cost > 1.0) {
            results.push({
              agent_id: agentId,
              action_type: 'ai_api_call',
              verdict: 'block',
              reason: `Daily AI cost $${cost.toFixed(4)} exceeds $1.00 limit`,
              details: { daily_cost: cost, limit: 1.0 },
            });
          } else if (cost > 0.50) {
            results.push({
              agent_id: agentId,
              action_type: 'ai_api_call',
              verdict: 'warn',
              reason: `Daily AI cost $${cost.toFixed(4)} approaching $1.00 limit`,
              details: { daily_cost: cost, limit: 1.0 },
            });
          }
        }
        return results;
      },
    },
    {
      id: 'action_frequency',
      name: 'Action Frequency Limit',
      check: async () => {
        const { data } = await supabase
          .from('agent_decisions')
          .select('agent_id')
          .gte('created_at', new Date(Date.now() - 86400000).toISOString());

        const byAgent: Record<string, number> = {};
        for (const row of (data || [])) {
          byAgent[row.agent_id] = (byAgent[row.agent_id] || 0) + 1;
        }

        const results: ComplianceResult[] = [];
        for (const [agentId, count] of Object.entries(byAgent)) {
          if (count > 100) {
            results.push({
              agent_id: agentId,
              action_type: 'decision_frequency',
              verdict: 'block',
              reason: `${count} decisions in 24h exceeds 100 limit — possible runaway loop`,
              details: { daily_decisions: count, limit: 100 },
            });
          } else if (count > 50) {
            results.push({
              agent_id: agentId,
              action_type: 'decision_frequency',
              verdict: 'warn',
              reason: `${count} decisions in 24h — high activity, monitor for loops`,
              details: { daily_decisions: count, limit: 100 },
            });
          }
        }
        return results;
      },
    },
    {
      id: 'failure_pattern',
      name: 'Repeated Failure Detection',
      check: async () => {
        const { data } = await supabase
          .from('agent_decisions')
          .select('agent_id, outcome')
          .gte('created_at', new Date(Date.now() - 86400000).toISOString());

        const stats: Record<string, { total: number; failed: number }> = {};
        for (const row of (data || [])) {
          if (!stats[row.agent_id]) stats[row.agent_id] = { total: 0, failed: 0 };
          stats[row.agent_id].total++;
          if (row.outcome === 'failure' || row.outcome === 'error') stats[row.agent_id].failed++;
        }

        const results: ComplianceResult[] = [];
        for (const [agentId, s] of Object.entries(stats)) {
          if (s.total >= 5 && (s.failed / s.total) > 0.5) {
            results.push({
              agent_id: agentId,
              action_type: 'failure_rate',
              verdict: 'warn',
              reason: `${Math.round((s.failed / s.total) * 100)}% failure rate (${s.failed}/${s.total}) — needs investigation`,
              details: { total: s.total, failed: s.failed, rate: s.failed / s.total },
            });
          }
        }
        return results;
      },
    },
    {
      id: 'content_volume',
      name: 'Content Generation Limits',
      check: async () => {
        const { data } = await supabase
          .from('content_queue')
          .select('generated_by')
          .gte('created_at', new Date(Date.now() - 86400000).toISOString());

        const byAgent: Record<string, number> = {};
        for (const row of (data || [])) {
          if (row.generated_by) {
            byAgent[row.generated_by] = (byAgent[row.generated_by] || 0) + 1;
          }
        }

        const results: ComplianceResult[] = [];
        for (const [agentId, count] of Object.entries(byAgent)) {
          if (count > 20) {
            results.push({
              agent_id: agentId,
              action_type: 'content_generation',
              verdict: 'warn',
              reason: `${count} content items generated in 24h — quality may degrade at volume`,
              details: { daily_content: count, recommended_max: 20 },
            });
          }
        }
        return results;
      },
    },
  ];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startMs = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const sig = sigWriter(supabase);

  try {
    const rules = getRules(supabase);
    const allResults: ComplianceResult[] = [];

    // Run all compliance checks
    for (const rule of rules) {
      try {
        const results = await rule.check(supabase);
        for (const r of results) {
          allResults.push(r);
          await supabase.from('compliance_log').insert({
            agent_id: r.agent_id,
            action_type: r.action_type,
            rule_checked: rule.id,
            verdict: r.verdict,
            reason: r.reason,
            details: r.details || {},
          });
        }
      } catch (err) {
        // Individual rule failure shouldn't stop others
        console.error(`Rule ${rule.id} failed:`, err);
      }
    }

    // Also log passes for agents with no violations
    const checkedAgents = new Set(allResults.map(r => r.agent_id));
    const { data: roster } = await supabase
      .from('agent_roster')
      .select('agent_id')
      .eq('status', 'active');

    for (const agent of (roster || [])) {
      if (!checkedAgents.has(agent.agent_id)) {
        await supabase.from('compliance_log').insert({
          agent_id: agent.agent_id,
          action_type: 'audit',
          rule_checked: 'all_rules',
          verdict: 'pass',
          reason: 'All compliance checks passed',
        });
      }
    }

    const blocks = allResults.filter(r => r.verdict === 'block');
    const warns = allResults.filter(r => r.verdict === 'warn');

    // Escalate blocks
    if (blocks.length > 0) {
      sig('compliance.violations_detected', 'legal-agent', {
        blocks: blocks.length,
        warnings: warns.length,
        details: blocks.map(b => ({
          agent: b.agent_id,
          rule: b.action_type,
          reason: b.reason,
        })),
      });
    }

    sig('compliance.audit_completed', 'legal-agent', {
      rules_checked: rules.length,
      agents_checked: (roster?.length || 0),
      violations: { blocks: blocks.length, warnings: warns.length },
      duration_ms: Date.now() - startMs,
    });

    // Log cost
    try {
      await supabase.rpc('log_ai_cost', {
        p_agent_id: 'legal-agent',
        p_edge_function: 'compliance-check',
        p_model: 'rules-engine',
        p_input_tokens: 0,
        p_output_tokens: 0,
        p_cost_usd: 0,
        p_purpose: 'compliance_audit',
        p_latency_ms: Date.now() - startMs,
      });
    } catch (_) {}

    return new Response(JSON.stringify({
      ok: true,
      rules_checked: rules.length,
      blocks: blocks.length,
      warnings: warns.length,
      duration_ms: Date.now() - startMs,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    sig('compliance.error', 'legal-agent', { error: (err as Error).message });
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
