// @ts-nocheck
/**
 * 🎧 SUPPORT AGENT
 *
 * AI-powered auto-responder for inbound customer emails.
 * Called by cron-worker when unread emails exist in `inbound_emails`.
 *
 * Flow:
 *  1. Fetch unprocessed emails from `inbound_emails`
 *  2. Classify intent with Claude (booking/technical/feedback/claim/other)
 *  3. Draft personalised reply
 *  4. Send reply via Resend
 *  5. Mark email as processed + write signal
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY') ?? '';
const ANTHROPIC_KEY   = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPPORT_SENDER  = 'Kosmoi Support <support@kosmoi.site>';
const MAX_PER_RUN     = 5;

const SYSTEM_PROMPT = `You are a friendly and helpful customer support agent for Kosmoi, a business discovery platform in Koh Samui, Thailand.
Kosmoi helps tourists find verified local businesses and allows business owners to claim and manage their profiles.

Key facts about Kosmoi:
- Business owners can claim their profile for 1 THB verification fee
- Profiles show up to thousands of visitors daily
- Dashboard at kosmoi.site/provider/dashboard
- Bookings and enquiries go through the platform
- Support email: support@kosmoi.site

Your task: Read the customer email and draft a helpful, concise reply. Be warm but professional.
Always end with: "The Kosmoi Team"

Categories and suggested actions:
- BOOKING: Help with booking questions, point to provider dashboard
- CLAIM: Help with claiming a business listing, explain the 1 THB fee process
- TECHNICAL: Escalate to "our technical team will look into this within 24h"
- FEEDBACK: Thank them warmly, note feedback will be shared with the team
- SPAM: Return empty reply (do not engage)
- OTHER: Answer helpfully or offer to connect them with the right person

Return JSON only:
{
  "category": "BOOKING|CLAIM|TECHNICAL|FEEDBACK|SPAM|OTHER",
  "subject": "reply subject line",
  "body_text": "plain text reply",
  "body_html": "HTML reply with basic formatting"
}`;

async function classifyAndReply(email: {
    id: string;
    sender: string;
    subject: string;
    body_text: string;
}): Promise<{ category: string; subject: string; body_text: string; body_html: string } | null> {
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

    const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [
            {
                role: 'user',
                content: `Inbound email from: ${email.sender}
Subject: ${email.subject}
Body:
${(email.body_text ?? '').slice(0, 1500)}

Draft a support reply.`
            }
        ],
        system: SYSTEM_PROMPT,
    });

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
}

async function sendEmail(to: string, subject: string, bodyHtml: string, bodyText: string): Promise<boolean> {
    const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: SUPPORT_SENDER,
            to,
            subject,
            html: bodyHtml,
            text: bodyText,
        }),
    });
    return resp.ok;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch unread emails
        const { data: emails, error: fetchErr } = await supabase
            .from('inbound_emails')
            .select('id, sender, recipient, subject, body_text, created_at')
            .eq('processed_status', 'unread')
            .order('created_at', { ascending: true })
            .limit(MAX_PER_RUN);

        if (fetchErr) throw new Error(`Fetch failed: ${fetchErr.message}`);

        const results: Array<{ id: string; category: string; replied: boolean; error?: string }> = [];

        for (const email of emails ?? []) {
            try {
                if (!ANTHROPIC_KEY) {
                    throw new Error('ANTHROPIC_API_KEY not configured');
                }

                const reply = await classifyAndReply(email);

                if (!reply || reply.category === 'SPAM') {
                    await supabase
                        .from('inbound_emails')
                        .update({ processed_status: reply?.category === 'SPAM' ? 'spam' : 'error' })
                        .eq('id', email.id);
                    results.push({ id: email.id, category: reply?.category ?? 'ERROR', replied: false });
                    continue;
                }

                // Send reply
                const sent = await sendEmail(email.sender, reply.subject, reply.body_html, reply.body_text);

                // Mark as processed
                await supabase
                    .from('inbound_emails')
                    .update({
                        processed_status: 'replied',
                        processed_at: new Date().toISOString(),
                        processing_notes: JSON.stringify({ category: reply.category, sent }),
                    })
                    .eq('id', email.id);

                // Write signal
                await supabase.rpc('write_signal', {
                    p_event_type: sent ? 'support.reply_sent' : 'support.reply_failed',
                    p_entity_type: 'system',
                    p_entity_id: email.id,
                    p_source: 'support-agent',
                    p_data: {
                        sender: email.sender,
                        subject: email.subject,
                        category: reply.category,
                        sent,
                    },
                }).catch(() => {});

                results.push({ id: email.id, category: reply.category, replied: sent });
                console.log(`[support-agent] ${sent ? '✅' : '⚠️'} Replied to ${email.sender} (${reply.category})`);

            } catch (emailErr: any) {
                console.error(`[support-agent] ❌ Email ${email.id}: ${emailErr.message}`);
                await supabase
                    .from('inbound_emails')
                    .update({ processed_status: 'error', processing_notes: emailErr.message })
                    .eq('id', email.id);
                results.push({ id: email.id, category: 'ERROR', replied: false, error: emailErr.message });
            }
        }

        const summary = {
            processed: results.length,
            replied: results.filter(r => r.replied).length,
            spam: results.filter(r => r.category === 'SPAM').length,
            errors: results.filter(r => r.category === 'ERROR').length,
            results,
        };

        console.log(`[support-agent] Done: ${summary.replied}/${summary.processed} replied`);

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('[support-agent] Fatal:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
