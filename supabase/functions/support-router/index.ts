// @ts-nocheck
/**
 * SUPPORT ROUTER AGENT
 * 
 * Smart support ticket handling:
 * 1. Analyzes incoming messages for sentiment & urgency
 * 2. Auto-responds for known FAQs
 * 3. Escalates urgent issues to Telegram
 * 4. Creates and routes tickets
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🆘 Support Router Agent Starting...');

// FAQ Database (can be moved to Supabase later)
const FAQS = [
    {
        keywords: ['price', 'cost', 'pricing', 'מחיר', 'עלות'],
        answer: 'Our pricing starts at ฿35 for 2 weeks, then ฿299/month. You can see all plans at kosmoi.site/pricing'
    },
    {
        keywords: ['trial', 'free', 'ניסיון', 'חינם'],
        answer: 'Yes! We offer a 2-week free trial for all new businesses. You can start at kosmoi.site/one-dollar'
    },
    {
        keywords: ['cancel', 'unsubscribe', 'ביטול'],
        answer: 'You can cancel anytime from your dashboard Settings > Subscription. No cancellation fees!'
    },
    {
        keywords: ['lead', 'leads', 'לידים'],
        answer: 'Leads are potential customers who contacted you through Kosmoi. You\'ll see them in your Dashboard > Leads section.'
    },
    {
        keywords: ['claim', 'business', 'verify', 'אימות'],
        answer: 'To claim your business, search for it on our site and click "Claim". You\'ll need to verify via phone or email.'
    },
    {
        keywords: ['payment', 'pay', 'card', 'תשלום', 'כרטיס'],
        answer: 'We accept all major credit cards via Stripe. You can update your payment method in Settings > Billing.'
    }
];

// Urgency keywords
const URGENT_KEYWORDS = ['urgent', 'emergency', 'broken', 'not working', 'hacked', 'stolen', 'fraud', 'דחוף', 'לא עובד', 'נפרץ'];
const NEGATIVE_KEYWORDS = ['angry', 'frustrated', 'terrible', 'awful', 'horrible', 'refund', 'sue', 'lawyer', 'מתוסכל', 'נורא', 'החזר'];

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const telegramChatId = Deno.env.get('TELEGRAM_ALERT_CHAT_ID');

        const supabase = createClient(supabaseUrl, supabaseKey);

        const body = await req.json();
        const { action, user_id, message, email, name } = body;

        const results = {
            action: action,
            success: false,
            message: '',
            auto_response: null,
            ticket_id: null,
            escalated: false
        };

        // ============================================
        // ACTION: NEW SUPPORT MESSAGE
        // ============================================
        if (action === 'NEW_MESSAGE') {
            console.log(`📩 New support message from ${email || user_id}`);

            const messageLower = message.toLowerCase();

            // 1. Check for FAQ match
            let faqMatch = null;
            for (const faq of FAQS) {
                for (const keyword of faq.keywords) {
                    if (messageLower.includes(keyword.toLowerCase())) {
                        faqMatch = faq;
                        break;
                    }
                }
                if (faqMatch) break;
            }

            // 2. Analyze urgency
            const isUrgent = URGENT_KEYWORDS.some(k => messageLower.includes(k.toLowerCase()));
            const isNegative = NEGATIVE_KEYWORDS.some(k => messageLower.includes(k.toLowerCase()));
            const priority = isUrgent ? 'urgent' : (isNegative ? 'high' : 'normal');

            // 3. Create ticket
            const { data: ticket } = await supabase
                .from('support_tickets')
                .insert({
                    user_id: user_id || null,
                    email: email,
                    name: name,
                    subject: message.substring(0, 100),
                    message: message,
                    status: 'open',
                    priority: priority,
                    auto_responded: !!faqMatch,
                    faq_matched: faqMatch ? faqMatch.keywords[0] : null
                })
                .select()
                .single();

            results.ticket_id = ticket?.id;

            // 4. If FAQ match, auto-respond
            if (faqMatch && email) {
                await sendSupportEmail(supabaseUrl, supabaseKey, {
                    to: email,
                    name: name || 'there',
                    answer: faqMatch.answer,
                    ticketId: ticket?.id
                });
                results.auto_response = faqMatch.answer;

                // Update ticket as auto-resolved
                await supabase
                    .from('support_tickets')
                    .update({ status: 'auto_resolved' })
                    .eq('id', ticket?.id);

                // Log FAQ usage
                await supabase
                    .from('support_faqs')
                    .upsert({
                        question: message.substring(0, 200),
                        matched_faq: faqMatch.keywords[0],
                        use_count: 1
                    }, {
                        onConflict: 'question',
                        count: 'exact'
                    });
            }

            // 5. If urgent or negative, escalate
            if ((isUrgent || isNegative) && telegramToken && telegramChatId) {
                await sendTelegramAlert(telegramToken, telegramChatId, {
                    priority: priority,
                    email: email,
                    name: name,
                    message: message.substring(0, 500),
                    ticketId: ticket?.id
                });
                results.escalated = true;

                await supabase
                    .from('support_tickets')
                    .update({ escalated_at: new Date().toISOString() })
                    .eq('id', ticket?.id);
            }

            results.success = true;
            results.message = faqMatch
                ? 'Auto-response sent'
                : (results.escalated ? 'Escalated to team' : 'Ticket created');
        }

        // ============================================
        // ACTION: GET UNANSWERED QUESTIONS (for learning)
        // ============================================
        else if (action === 'GET_UNANSWERED') {
            const { data: unanswered } = await supabase
                .from('support_tickets')
                .select('subject, message')
                .eq('auto_responded', false)
                .order('created_at', { ascending: false })
                .limit(50);

            results.success = true;
            results.details = { unanswered_tickets: unanswered };
        }

        // ============================================
        // ACTION: RESOLVE TICKET
        // ============================================
        else if (action === 'RESOLVE') {
            const { ticket_id } = body;
            await supabase
                .from('support_tickets')
                .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString()
                })
                .eq('id', ticket_id);
            results.success = true;
            results.message = 'Ticket resolved';
        }

        // ============================================
        // ACTION: ESCALATE_ALL_URGENT (Called by CEO)
        // ============================================
        else if (action === 'ESCALATE_ALL_URGENT') {
            // Find all urgent tickets not yet escalated
            const { data: urgentTickets } = await supabase
                .from('support_tickets')
                .select('*')
                .in('priority', ['urgent', 'high'])
                .eq('status', 'open')
                .is('escalated_at', null)
                .limit(10);

            let escalated = 0;
            if (telegramToken && telegramChatId && urgentTickets) {
                for (const ticket of urgentTickets) {
                    await sendTelegramAlert(telegramToken, telegramChatId, {
                        priority: ticket.priority,
                        email: ticket.email,
                        name: ticket.name,
                        message: ticket.message?.substring(0, 500) || ticket.subject,
                        ticketId: ticket.id
                    });

                    await supabase
                        .from('support_tickets')
                        .update({ escalated_at: new Date().toISOString() })
                        .eq('id', ticket.id);

                    escalated++;
                }
            }

            results.success = true;
            results.message = `Escalated ${escalated} tickets`;
            results.escalated = escalated;
        }

        // Log the action
        await supabase.from('agent_decisions').insert({
            agent_id: 'support-router',
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
        console.error('Support Router Error:', error);
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
// HELPER: SEND SUPPORT EMAIL
// ============================================
async function sendSupportEmail(supabaseUrl: string, supabaseKey: string, data: any) {
    const emailUrl = supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1/send-email');

    await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
            to: data.to,
            subject: `Re: Your question - Ticket #${data.ticketId?.substring(0, 8)}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                    <h2>Hi ${data.name}!</h2>
                    <p>Thanks for reaching out. Here's the answer to your question:</p>
                    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
                        ${data.answer}
                    </div>
                    <p>If this doesn't answer your question, just reply to this email and a human will get back to you shortly!</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #888; font-size: 12px;">
                        Ticket ID: ${data.ticketId}<br>
                        The Kosmoi Support Team
                    </p>
                </div>
            `
        })
    });
}

// ============================================
// HELPER: SEND TELEGRAM ALERT
// ============================================
async function sendTelegramAlert(token: string, chatId: string, data: any) {
    const priorityEmoji = data.priority === 'urgent' ? '🚨' : '⚠️';
    const message = `
${priorityEmoji} *${data.priority.toUpperCase()} SUPPORT TICKET*

📧 From: ${data.email || 'Unknown'}
👤 Name: ${data.name || 'Unknown'}
🎫 Ticket: ${data.ticketId}

📝 Message:
${data.message}

[View in Dashboard](https://kosmoi.site/admin/support)
    `.trim();

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    });
}
