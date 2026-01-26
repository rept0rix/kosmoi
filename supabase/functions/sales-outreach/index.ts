// @ts-nocheck
/**
 * SALES OUTREACH AGENT
 * 
 * Automatically contacts new businesses discovered by Scout:
 * 1. Generates personalized message using Gemini AI
 * 2. Sends via email (if available)
 * 3. Schedules follow-up sequence
 * 4. Tracks opens/clicks for optimization
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('📞 Sales Outreach Agent Starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const { action, business_id } = body;

        const results = {
            action: action,
            success: false,
            message: '',
            details: {}
        };

        // ============================================
        // ACTION: NEW BUSINESS OUTREACH
        // ============================================
        if (action === 'NEW_BUSINESS') {
            console.log(`📧 Starting outreach for business: ${business_id}`);

            // Get business details
            const { data: business } = await supabase
                .from('service_providers')
                .select('*')
                .eq('id', business_id)
                .single();

            if (!business) {
                results.message = 'Business not found';
                return new Response(JSON.stringify(results), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 404
                });
            }

            // Check if already contacted
            const { data: existing } = await supabase
                .from('outreach_sequences')
                .select('id')
                .eq('business_id', business_id)
                .limit(1);

            if (existing && existing.length > 0) {
                results.message = 'Already contacted';
                results.success = true;
                return new Response(JSON.stringify(results), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                });
            }

            // Skip if no contact info
            if (!business.email && !business.phone) {
                console.log('⚠️ No contact info, skipping');
                results.message = 'No contact info available';
                return new Response(JSON.stringify(results), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                });
            }

            // Generate personalized message using Gemini
            const message = await generatePersonalizedMessage(geminiKey, business);

            // Create outreach sequence
            const { data: sequence } = await supabase
                .from('outreach_sequences')
                .insert({
                    business_id: business_id,
                    sequence_type: 'new_business',
                    step: 1,
                    max_steps: 5,
                    next_send_at: new Date().toISOString(),
                    status: 'active'
                })
                .select()
                .single();

            // Send first message
            if (business.email) {
                await sendOutreachEmail(supabaseUrl, supabaseKey, {
                    to: business.email,
                    businessName: business.business_name,
                    message: message,
                    sequenceId: sequence?.id
                });

                // Log the message
                await supabase.from('outreach_messages').insert({
                    sequence_id: sequence?.id,
                    channel: 'email',
                    content: message,
                    sent_at: new Date().toISOString()
                });
            }

            // Update business status
            await supabase
                .from('service_providers')
                .update({
                    status: 'outreach_sent',
                    ai_notes: (business.ai_notes || '') + `\n[${new Date().toISOString()}] First outreach sent`
                })
                .eq('id', business_id);

            // Schedule follow-up (3 days)
            await supabase
                .from('outreach_sequences')
                .update({
                    next_send_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', sequence?.id);

            results.success = true;
            results.message = 'Outreach sent successfully';
            results.details = { sequence_id: sequence?.id };
        }

        // ============================================
        // ACTION: PROCESS FOLLOW-UPS (Cron)
        // ============================================
        else if (action === 'PROCESS_FOLLOWUPS') {
            const now = new Date().toISOString();

            // Get due follow-ups
            const { data: dueSequences } = await supabase
                .from('outreach_sequences')
                .select('*, service_providers!inner(*)')
                .eq('status', 'active')
                .lt('next_send_at', now);

            let processed = 0;
            for (const seq of dueSequences || []) {
                if (seq.step >= seq.max_steps) {
                    // Max attempts reached
                    await supabase
                        .from('outreach_sequences')
                        .update({ status: 'completed' })
                        .eq('id', seq.id);
                    continue;
                }

                const business = seq.service_providers;
                const followUpMessage = await generateFollowUpMessage(geminiKey, business, seq.step);

                // Send follow-up
                if (business.email) {
                    await sendOutreachEmail(supabaseUrl, supabaseKey, {
                        to: business.email,
                        businessName: business.business_name,
                        message: followUpMessage,
                        sequenceId: seq.id,
                        isFollowUp: true
                    });

                    await supabase.from('outreach_messages').insert({
                        sequence_id: seq.id,
                        channel: 'email',
                        content: followUpMessage,
                        sent_at: new Date().toISOString()
                    });
                }

                // Update sequence
                await supabase
                    .from('outreach_sequences')
                    .update({
                        step: seq.step + 1,
                        next_send_at: new Date(Date.now() + (seq.step + 2) * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .eq('id', seq.id);

                processed++;
            }

            results.success = true;
            results.message = `Processed ${processed} follow-ups`;
        }

        // ============================================
        // ACTION: TRACK OPEN
        // ============================================
        else if (action === 'TRACK_OPEN') {
            const { message_id } = body;
            await supabase
                .from('outreach_messages')
                .update({ opened_at: new Date().toISOString() })
                .eq('id', message_id);
            results.success = true;
        }

        // ============================================
        // ACTION: TRACK CLICK
        // ============================================
        else if (action === 'TRACK_CLICK') {
            const { message_id } = body;
            await supabase
                .from('outreach_messages')
                .update({ clicked_at: new Date().toISOString() })
                .eq('id', message_id);
            results.success = true;
        }

        // Log the action
        await supabase.from('agent_decisions').insert({
            agent_id: 'sales-outreach',
            decision_type: action,
            action: body,
            result: results,
            success: results.success
        });

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Sales Outreach Error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            success: false
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});

// ============================================
// HELPER: GENERATE PERSONALIZED MESSAGE
// ============================================
async function generatePersonalizedMessage(apiKey: string, business: any): Promise<string> {
    if (!apiKey) {
        return getDefaultMessage(business);
    }

    try {
        const prompt = `
You are a friendly sales agent for Kosmoi, a platform that helps local businesses in Koh Samui get more customers.

Write a short, friendly outreach email to this business:
- Business Name: ${business.business_name}
- Category: ${business.category || business.super_category || 'local business'}
- Location: ${business.location || 'Koh Samui'}

Requirements:
- Write in English (many businesses are run by expats)
- Keep it under 100 words
- Be friendly, not salesy
- Mention ONE specific benefit relevant to their category
- Include a clear call to action
- Do NOT include subject line, just the body

Example benefits by category:
- Restaurant: "Get featured when tourists search for places to eat"
- Hotel: "Appear in our tourist recommendations"
- Activity: "Connect with visitors looking for experiences"
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 300
                    }
                })
            }
        );

        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            return generatedText.trim();
        }
    } catch (error) {
        console.error('Gemini generation failed:', error);
    }

    return getDefaultMessage(business);
}

// ============================================
// HELPER: GENERATE FOLLOW-UP MESSAGE
// ============================================
async function generateFollowUpMessage(apiKey: string, business: any, step: number): Promise<string> {
    const followUpTemplates = [
        `Hey! Just following up on my message about Kosmoi. Many ${business.category || 'businesses'} in Samui are already getting great results. Want me to show you how?`,
        `Hi there! I noticed you haven't had a chance to check out Kosmoi yet. We've helped businesses like yours get up to 50 new leads. Interested?`,
        `Last chance! We're offering a special deal for ${business.business_name} - first 2 weeks completely free. Reply to claim it!`
    ];

    return followUpTemplates[Math.min(step - 1, followUpTemplates.length - 1)];
}

// ============================================
// HELPER: DEFAULT MESSAGE
// ============================================
function getDefaultMessage(business: any): string {
    return `Hi there!

I'm reaching out from Kosmoi - we help local businesses in Koh Samui connect with tourists and expats looking for exactly what you offer.

${business.business_name} looks like a great fit for our platform. We could help you get more visibility and leads from people actively searching for ${business.category || 'your services'}.

Would you be interested in a free trial? We're offering 2 weeks at no cost to see if it works for you.

Just reply to this email and I'll set you up!

Best,
The Kosmoi Team`;
}

// ============================================
// HELPER: SEND OUTREACH EMAIL
// ============================================
async function sendOutreachEmail(supabaseUrl: string, supabaseKey: string, data: any) {
    const emailUrl = supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1/send-email');

    await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
            to: data.to,
            subject: data.isFollowUp
                ? `Following up - ${data.businessName}`
                : `Opportunity for ${data.businessName} on Kosmoi`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                    <p style="white-space: pre-line; line-height: 1.6;">${data.message}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #888; font-size: 12px;">
                        This email was sent by Kosmoi. 
                        <a href="https://kosmoi.site/unsubscribe?id=${data.sequenceId}">Unsubscribe</a>
                    </p>
                </div>
            `
        })
    });
}
