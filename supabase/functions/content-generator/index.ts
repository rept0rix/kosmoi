// ================================================================
// CONTENT GENERATOR — Creative Agent Edge Function
//
// Serves both blog-writer and content-designer agents.
// Picks up items from content_queue, generates via Claude,
// saves results, and writes signals.
//
// Trigger: Called by Cortex when content.queued signal detected,
//          or by department-sync when CMO requests content.
// ================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Content type configs ──────────────────────────────────────
const CONTENT_CONFIGS: Record<string, {
  agent_id: string;
  system_prompt: string;
  max_tokens: number;
  output_format: string;
}> = {
  blog_post: {
    agent_id: 'blog-writer',
    system_prompt: `You are a professional blog writer for a service marketplace platform in Koh Samui, Thailand.

Write engaging, SEO-optimized blog posts that:
- Are 600-1200 words
- Include a compelling headline
- Use headers (H2, H3) for structure
- Include a meta description (under 160 chars)
- Suggest 3-5 relevant tags
- Have a clear call-to-action at the end
- Tone: friendly, professional, locally aware

Output JSON: { "title": "...", "body": "markdown content", "meta_description": "...", "tags": ["..."], "cta": "...", "estimated_read_time": "X min" }`,
    max_tokens: 4096,
    output_format: 'json',
  },

  social_copy: {
    agent_id: 'content-designer',
    system_prompt: `You are a social media copywriter for a service marketplace in Koh Samui.

Create engaging social media copy:
- Instagram: visual-first, 2-3 lines + hashtags
- Facebook: slightly longer, conversational
- Short, punchy, emoji-appropriate
- Include a CTA

Output JSON: { "instagram": { "caption": "...", "hashtags": ["..."] }, "facebook": { "post": "..." }, "suggested_visual": "description of ideal image" }`,
    max_tokens: 1024,
    output_format: 'json',
  },

  meta_description: {
    agent_id: 'content-designer',
    system_prompt: `You are an SEO specialist. Write compelling meta descriptions for web pages.

Rules:
- Under 160 characters
- Include target keyword naturally
- Include a call-to-action
- Be specific and enticing

Output JSON: { "meta_description": "...", "title_tag": "...", "og_description": "..." }`,
    max_tokens: 256,
    output_format: 'json',
  },

  email_template: {
    agent_id: 'content-designer',
    system_prompt: `You are an email marketing specialist for a service marketplace in Koh Samui.

Create email templates that:
- Have a compelling subject line
- Are concise (under 200 words body)
- Include personalization placeholders {{name}}, {{service}}
- Have a clear single CTA
- Professional but warm tone

Output JSON: { "subject": "...", "preview_text": "...", "body_html": "...", "body_text": "...", "cta_text": "...", "cta_url": "..." }`,
    max_tokens: 2048,
    output_format: 'json',
  },

  visual_brief: {
    agent_id: 'content-designer',
    system_prompt: `You are a creative director creating visual briefs for a design team.

Create detailed visual briefs:
- Describe the visual concept
- Specify dimensions/format
- Color palette suggestions
- Typography direction
- Mood/style references
- Key elements to include

Output JSON: { "concept": "...", "dimensions": "...", "colors": ["..."], "typography": "...", "mood": "...", "elements": ["..."], "reference_styles": ["..."] }`,
    max_tokens: 1024,
    output_format: 'json',
  },
};

// ── Signal helper ──────────────────────────────────────────────
function sigWriter(supabase: any) {
  return (eventType: string, entityId: string, data: Record<string, any>) => {
    supabase.rpc('write_signal', {
      p_event_type: eventType,
      p_entity_id: entityId,
      p_data: data,
    }).catch(() => {}); // non-fatal
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
    const body = await req.json().catch(() => ({}));
    const { content_id, batch_limit = 5 } = body;

    // ── Mode 1: Generate specific content item ──────────────
    if (content_id) {
      const result = await generateOne(supabase, apiKey, content_id, sig);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Mode 2: Process queue (batch) ───────────────────────
    const { data: queue } = await supabase
      .from('content_queue')
      .select('id')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(batch_limit);

    if (!queue?.length) {
      return new Response(JSON.stringify({
        ok: true, processed: 0, message: 'Queue empty'
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];
    for (const item of queue) {
      const r = await generateOne(supabase, apiKey, item.id, sig);
      results.push(r);
    }

    const succeeded = results.filter(r => r.ok).length;
    sig('content.batch_completed', 'content-generator', {
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
      duration_ms: Date.now() - startMs,
    });

    return new Response(JSON.stringify({
      ok: true,
      processed: results.length,
      succeeded,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    sig('content.error', 'content-generator', { error: (err as Error).message });
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Generate a single content item ────────────────────────────
async function generateOne(
  supabase: any,
  apiKey: string | undefined,
  contentId: string,
  sig: (e: string, id: string, d: any) => void
) {
  const startMs = Date.now();

  // Fetch the queue item
  const { data: item, error: fetchErr } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchErr || !item) {
    return { ok: false, content_id: contentId, error: 'Not found' };
  }

  if (item.status !== 'queued') {
    return { ok: false, content_id: contentId, error: `Wrong status: ${item.status}` };
  }

  const config = CONTENT_CONFIGS[item.content_type];
  if (!config) {
    return { ok: false, content_id: contentId, error: `Unknown type: ${item.content_type}` };
  }

  // Mark as generating
  await supabase
    .from('content_queue')
    .update({ status: 'generating', generated_by: config.agent_id, updated_at: new Date().toISOString() })
    .eq('id', contentId);

  sig('content.generating', contentId, {
    content_type: item.content_type,
    agent: config.agent_id,
  });

  // ── Generate with Claude ────────────────────────────────
  if (!apiKey) {
    // Fallback: create placeholder content
    const placeholder = {
      title: `[Draft] ${item.prompt.slice(0, 50)}`,
      body: `Content generation pending — API key not configured.\n\nPrompt: ${item.prompt}`,
      note: 'Generated without AI — configure ANTHROPIC_API_KEY',
    };

    await supabase.from('content_queue').update({
      status: 'review',
      result: placeholder,
      quality_score: 3.0,
      duration_ms: Date.now() - startMs,
      updated_at: new Date().toISOString(),
    }).eq('id', contentId);

    sig('content.generated_fallback', contentId, { content_type: item.content_type });
    return { ok: true, content_id: contentId, mode: 'fallback' };
  }

  try {
    const userMessage = buildPrompt(item);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: config.max_tokens,
        system: config.system_prompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResult = await response.json();
    const rawText = claudeResult.content?.[0]?.text || '';
    const tokensUsed = (claudeResult.usage?.input_tokens || 0) + (claudeResult.usage?.output_tokens || 0);

    // Try to parse JSON from response
    let parsedResult: any;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { body: rawText };
    } catch {
      parsedResult = { body: rawText };
    }

    // Auto quality score based on content length and structure
    const qualityScore = estimateQuality(item.content_type, parsedResult);

    await supabase.from('content_queue').update({
      status: qualityScore >= 7 ? 'review' : 'review',
      result: parsedResult,
      title: parsedResult.title || item.title,
      quality_score: qualityScore,
      tokens_used: tokensUsed,
      model_used: 'claude-haiku-4-5-20251001',
      duration_ms: Date.now() - startMs,
      updated_at: new Date().toISOString(),
    }).eq('id', contentId);

    sig('content.generated', contentId, {
      content_type: item.content_type,
      agent: config.agent_id,
      quality_score: qualityScore,
      tokens_used: tokensUsed,
      duration_ms: Date.now() - startMs,
    });

    // If blog post with quality >= 8, also insert into blog_posts table
    if (item.content_type === 'blog_post' && qualityScore >= 8 && parsedResult.title && parsedResult.body) {
      await supabase.from('blog_posts').insert({
        title: parsedResult.title,
        content: parsedResult.body,
        author: 'AI Blog Writer',
        status: 'draft',
        tags: parsedResult.tags || [],
        meta_description: parsedResult.meta_description || '',
      }).catch(() => {}); // non-fatal
    }

    return {
      ok: true,
      content_id: contentId,
      mode: 'claude',
      quality_score: qualityScore,
      tokens_used: tokensUsed,
    };

  } catch (err) {
    await supabase.from('content_queue').update({
      status: 'queued', // put back in queue for retry
      updated_at: new Date().toISOString(),
    }).eq('id', contentId);

    sig('content.generation_failed', contentId, {
      error: (err as Error).message,
      content_type: item.content_type,
    });

    return { ok: false, content_id: contentId, error: (err as Error).message };
  }
}

// ── Build the user prompt with context ────────────────────────
function buildPrompt(item: any): string {
  let prompt = item.prompt;

  if (item.context && Object.keys(item.context).length > 0) {
    prompt += `\n\nContext data:\n${JSON.stringify(item.context, null, 2)}`;
  }

  if (item.target_audience) {
    prompt += `\n\nTarget audience: ${item.target_audience}`;
  }

  if (item.publish_to?.length) {
    prompt += `\nPublish to: ${item.publish_to.join(', ')}`;
  }

  return prompt;
}

// ── Estimate content quality ──────────────────────────────────
function estimateQuality(contentType: string, result: any): number {
  let score = 5; // baseline

  if (contentType === 'blog_post') {
    if (result.title) score += 1;
    if (result.body?.length > 500) score += 1;
    if (result.body?.length > 1000) score += 1;
    if (result.meta_description) score += 0.5;
    if (result.tags?.length >= 3) score += 0.5;
    if (result.cta) score += 0.5;
    if (result.body?.includes('##')) score += 0.5; // has headers
  } else if (contentType === 'social_copy') {
    if (result.instagram?.caption) score += 1.5;
    if (result.facebook?.post) score += 1.5;
    if (result.instagram?.hashtags?.length >= 3) score += 1;
    if (result.suggested_visual) score += 1;
  } else if (contentType === 'email_template') {
    if (result.subject) score += 1;
    if (result.body_html || result.body_text) score += 2;
    if (result.cta_text) score += 1;
    if (result.preview_text) score += 1;
  } else {
    // Generic: just check there's meaningful content
    const text = JSON.stringify(result);
    if (text.length > 100) score += 1;
    if (text.length > 500) score += 2;
  }

  return Math.min(10, Math.round(score * 10) / 10);
}
