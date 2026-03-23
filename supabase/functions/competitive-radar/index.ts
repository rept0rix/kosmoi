// ================================================================
// COMPETITIVE RADAR — Intelligence Agent Edge Function
//
// Analyzes platform data + market context to detect competitive
// threats and opportunities. Reports to CMO.
//
// Schedule: Every 4 hours (via pg_cron or Cortex directive)
// Output: competitive_intel rows + signals
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Known competitors to track ────────────────────────────────
const COMPETITORS = [
  { name: 'GetYourGuide', url: 'https://www.getyourguide.com', category: 'tours' },
  { name: 'Klook', url: 'https://www.klook.com', category: 'activities' },
  { name: 'Viator', url: 'https://www.viator.com', category: 'tours' },
  { name: 'Airbnb Experiences', url: 'https://www.airbnb.com/experiences', category: 'experiences' },
  { name: 'Local competitors', url: null, category: 'local_services' },
];

function sigWriter(supabase: any) {
  return (eventType: string, entityId: string, data: Record<string, any>) => {
    supabase.rpc('write_signal', {
      p_event_type: eventType,
      p_entity_id: entityId,
      p_data: data,
    }).catch(() => {});
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startMs = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const sig = sigWriter(supabase);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  try {
    // ── Step 1: Gather our platform's current state ────────
    const [snapshotRes, recentSignals, recentIntel] = await Promise.all([
      supabase.rpc('get_platform_snapshot'),
      supabase
        .from('signals')
        .select('event_type, data, created_at')
        .in('event_type', [
          'payment.failed', 'support.escalated', 'subscription.cancelled_nonpayment',
          'booking.created', 'provider.onboarded', 'user.churned',
        ])
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('competitive_intel')
        .select('competitor_name, intel_type, summary, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const snapshot = snapshotRes.data || {};
    const signals = recentSignals.data || [];
    const previousIntel = recentIntel.data || [];

    // ── Step 2: Analyze with Claude ────────────────────────
    if (!apiKey) {
      // Fallback: generate basic intel from platform data alone
      const fallbackIntel = generateFallbackIntel(snapshot, signals);
      for (const intel of fallbackIntel) {
        await supabase.from('competitive_intel').insert(intel);
        sig('intel.detected', intel.competitor_name, {
          type: intel.intel_type,
          severity: intel.severity,
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        mode: 'fallback',
        intel_generated: fallbackIntel.length,
        duration_ms: Date.now() - startMs,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You are a competitive intelligence analyst for a service marketplace platform in Koh Samui, Thailand.

Your job is to analyze our platform data and identify:
1. THREATS — things competitors might be doing better
2. OPPORTUNITIES — gaps we can exploit
3. TRENDS — market shifts we should prepare for
4. WEAKNESSES — internal issues that competitors could exploit

Known competitors: ${COMPETITORS.map(c => c.name).join(', ')}

Based on the platform data provided, generate intelligence reports.

Output JSON array: [
  {
    "competitor_name": "Name or 'market_trend'",
    "intel_type": "pricing_change|new_feature|market_move|review_sentiment|social_trend",
    "severity": "low|medium|high|critical",
    "summary": "Clear, actionable 1-2 sentence summary",
    "raw_data": { "evidence": "what data supports this", "confidence": 0.0-1.0 },
    "recommended_action": "What should we do about this"
  }
]

Be specific. Don't invent data you don't have. Focus on actionable insights from the platform metrics provided.
Generate 1-5 insights. Quality over quantity.`;

    const userMessage = `## Our Platform Data (last 24h)
${JSON.stringify(snapshot, null, 2)}

## Recent Signals
${signals.map(s => `- ${s.event_type}: ${JSON.stringify(s.data)}`).join('\n')}

## Previous Intel (for continuity, don't repeat)
${previousIntel.map(i => `- [${i.intel_type}] ${i.competitor_name}: ${i.summary}`).join('\n')}

Analyze and generate new competitive intelligence:`;

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
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API ${response.status}`);
    }

    const claudeResult = await response.json();
    const rawText = claudeResult.content?.[0]?.text || '[]';
    const tokensUsed = (claudeResult.usage?.input_tokens || 0) + (claudeResult.usage?.output_tokens || 0);

    // Parse intel array
    let intelItems: any[] = [];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      intelItems = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      intelItems = [];
    }

    // ── Step 3: Save intel ─────────────────────────────────
    let saved = 0;
    for (const item of intelItems.slice(0, 5)) {
      const { error } = await supabase.from('competitive_intel').insert({
        competitor_name: item.competitor_name || 'unknown',
        intel_type: item.intel_type || 'market_move',
        severity: item.severity || 'low',
        summary: item.summary || 'No summary',
        raw_data: {
          ...item.raw_data,
          recommended_action: item.recommended_action,
          model: 'claude-haiku-4-5-20251001',
          tokens: tokensUsed,
        },
        detected_by: 'competitive-radar',
      });

      if (!error) {
        saved++;
        sig('intel.detected', item.competitor_name, {
          type: item.intel_type,
          severity: item.severity,
          summary_preview: item.summary?.slice(0, 100),
        });
      }
    }

    // Escalate critical/high severity items
    const critical = intelItems.filter(i => i.severity === 'critical' || i.severity === 'high');
    if (critical.length > 0) {
      sig('intel.escalation', 'competitive-radar', {
        to: 'cmo',
        count: critical.length,
        items: critical.map(i => ({ competitor: i.competitor_name, summary: i.summary })),
      });
    }

    // ── Step 4: Request content if opportunity detected ────
    const opportunities = intelItems.filter(i =>
      i.intel_type === 'market_move' || i.recommended_action?.toLowerCase().includes('blog')
    );
    if (opportunities.length > 0) {
      // Queue a blog post about the market trend
      await supabase.rpc('queue_content', {
        p_content_type: 'blog_post',
        p_prompt: `Write a blog post about recent market trends in Koh Samui services: ${opportunities.map(o => o.summary).join('. ')}`,
        p_requested_by: 'competitive-radar',
        p_context: { triggered_by: 'competitive_analysis', intel_count: opportunities.length },
        p_target_audience: 'providers',
        p_publish_to: ['blog'],
      }).catch(() => {});
    }

    sig('intel.scan_completed', 'competitive-radar', {
      insights_generated: saved,
      critical_count: critical.length,
      tokens_used: tokensUsed,
      duration_ms: Date.now() - startMs,
    });

    return new Response(JSON.stringify({
      ok: true,
      mode: 'claude',
      intel_generated: saved,
      critical_escalated: critical.length,
      content_requested: opportunities.length > 0,
      tokens_used: tokensUsed,
      duration_ms: Date.now() - startMs,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    sig('intel.error', 'competitive-radar', { error: (err as Error).message });
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Fallback intel when no API key ────────────────────────────
function generateFallbackIntel(snapshot: any, signals: any[]): any[] {
  const intel: any[] = [];

  // Check churn signals
  const churnSignals = signals.filter(s =>
    s.event_type === 'subscription.cancelled_nonpayment' || s.event_type === 'user.churned'
  );
  if (churnSignals.length >= 3) {
    intel.push({
      competitor_name: 'market_trend',
      intel_type: 'review_sentiment',
      severity: 'high',
      summary: `${churnSignals.length} churn events in 24h — users may be switching to competitors. Investigate retention.`,
      raw_data: { churn_count: churnSignals.length, source: 'internal_signals' },
      detected_by: 'competitive-radar',
    });
  }

  // Check payment failures
  const paymentFails = signals.filter(s => s.event_type === 'payment.failed');
  if (paymentFails.length >= 5) {
    intel.push({
      competitor_name: 'market_trend',
      intel_type: 'market_move',
      severity: 'medium',
      summary: `High payment failure rate (${paymentFails.length}/24h). Consider adding alternative payment methods.`,
      raw_data: { fail_count: paymentFails.length, source: 'payment_signals' },
      detected_by: 'competitive-radar',
    });
  }

  // General market insight
  if (intel.length === 0) {
    intel.push({
      competitor_name: 'market_trend',
      intel_type: 'social_trend',
      severity: 'low',
      summary: 'No significant competitive events detected. Market appears stable.',
      raw_data: { snapshot_summary: 'stable', source: 'fallback_analysis' },
      detected_by: 'competitive-radar',
    });
  }

  return intel;
}
