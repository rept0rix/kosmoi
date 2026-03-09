// @ts-nocheck
/**
 * PAYMENT RECOVERY AGENT
 * 
 * Automatically handles failed payments:
 * 1. Receives webhook from Stripe on payment failure
 * 2. Sends recovery email to customer
 * 3. Schedules retry attempts (24h, 48h, 72h)
 * 4. Marks subscription as cancelled after 3 failures
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('💳 Payment Recovery Agent Starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';

        // Helper: write signal non-fatally
        const sig = (eventType: string, entityType: string, entityId: string | null, data: object) =>
            supabase.rpc('write_signal', { p_event_type: eventType, p_entity_type: entityType, p_entity_id: entityId, p_source: 'payment-recovery', p_data: data }).catch(() => {});

        const supabase = createClient(supabaseUrl, supabaseKey);
        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

        const body = await req.json();
        const { action, subscription_id, customer_email, customer_id, attempt_number } = body;

        const results = {
            action: action,
            success: false,
            message: '',
            details: {}
        };

        // ============================================
        // ACTION: HANDLE PAYMENT FAILURE
        // ============================================
        if (action === 'PAYMENT_FAILED') {
            console.log(`💔 Payment failed for ${customer_email}`);

            // 1. Find subscription in our DB
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*, users!inner(id, email, full_name)')
                .eq('stripe_customer_id', customer_id)
                .single();

            if (!subscription) {
                results.message = 'Subscription not found';
                return new Response(JSON.stringify(results), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 404
                });
            }

            // 2. Update subscription status
            await supabase
                .from('subscriptions')
                .update({ status: 'past_due' })
                .eq('id', subscription.id);

            // 3. Create recovery attempt record
            const { data: recovery } = await supabase
                .from('payment_recovery_attempts')
                .insert({
                    subscription_id: subscription.id,
                    attempt_number: 1,
                    status: 'pending'
                })
                .select()
                .single();

            // 4. Send recovery email
            await sendRecoveryEmail(supabaseUrl, supabaseKey, {
                to: subscription.users.email,
                name: subscription.users.full_name || subscription.users.email,
                customer_id: customer_id,
                attempt: 1,
            });

            await sig('booking.payment_failed', 'user', subscription.users.id, {
                customer_id,
                attempt: 1,
                email: subscription.users.email,
            });

            results.success = true;
            results.message = 'Recovery email sent';
            results.details = { recovery_id: recovery?.id };
        }

        // ============================================
        // ACTION: RETRY PAYMENT
        // ============================================
        else if (action === 'RETRY_PAYMENT') {
            console.log(`🔄 Retrying payment for customer ${customer_id}, attempt ${attempt_number}`);

            // Get latest invoice
            const invoices = await stripe.invoices.list({
                customer: customer_id,
                status: 'open',
                limit: 1
            });

            if (invoices.data.length === 0) {
                results.message = 'No open invoices found';
                return new Response(JSON.stringify(results), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                });
            }

            const invoice = invoices.data[0];

            try {
                // Attempt to pay the invoice
                await stripe.invoices.pay(invoice.id);

                // Success! Update records
                await supabase
                    .from('subscriptions')
                    .update({ status: 'active' })
                    .eq('stripe_customer_id', customer_id);

                await supabase
                    .from('payment_recovery_attempts')
                    .update({ status: 'recovered' })
                    .eq('subscription_id', subscription_id)
                    .eq('attempt_number', attempt_number);

                results.success = true;
                results.message = 'Payment recovered successfully!';

            } catch (payError: any) {
                console.log(`❌ Retry failed: ${payError.message}`);

                // Update attempt status
                await supabase
                    .from('payment_recovery_attempts')
                    .update({ status: 'failed' })
                    .eq('subscription_id', subscription_id)
                    .eq('attempt_number', attempt_number);

                // If this was attempt 3, cancel subscription
                if (attempt_number >= 3) {
                    await supabase
                        .from('subscriptions')
                        .update({ status: 'cancelled' })
                        .eq('stripe_customer_id', customer_id);

                    // Send final email
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('*, users!inner(email, full_name)')
                        .eq('stripe_customer_id', customer_id)
                        .single();

                    if (sub) {
                        await sendCancellationEmail(supabaseUrl, supabaseKey, {
                            to: sub.users.email,
                            name: sub.users.full_name
                        });
                    }

                    results.message = 'Subscription cancelled after 3 failed attempts';
                } else {
                    // Schedule next retry
                    const nextAttempt = attempt_number + 1;
                    await supabase
                        .from('payment_recovery_attempts')
                        .insert({
                            subscription_id: subscription_id,
                            attempt_number: nextAttempt,
                            status: 'scheduled'
                        });

                    results.message = `Retry ${attempt_number} failed, attempt ${nextAttempt} scheduled`;
                }
            }
        }

        // ============================================
        // ACTION: PROCESS SCHEDULED RETRIES (Cron)
        // ============================================
        else if (action === 'PROCESS_SCHEDULED') {
            // Find recovery attempts that are due
            const now = new Date();
            const { data: dueAttempts } = await supabase
                .from('payment_recovery_attempts')
                .select('*, subscriptions!inner(stripe_customer_id)')
                .eq('status', 'scheduled')
                .lt('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

            let processed = 0;
            for (const attempt of dueAttempts || []) {
                // Trigger retry
                await fetch(`${supabaseUrl}/functions/v1/payment-recovery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
                    body: JSON.stringify({
                        action: 'RETRY_PAYMENT',
                        customer_id: attempt.subscriptions.stripe_customer_id,
                        subscription_id: attempt.subscription_id,
                        attempt_number: attempt.attempt_number,
                    }),
                });
                await sig('payment.retry_scheduled', 'subscription', attempt.subscription_id, {
                    attempt_number: attempt.attempt_number,
                    customer_id: attempt.subscriptions.stripe_customer_id,
                });
                processed++;
            }

            results.success = true;
            results.message = `Processed ${processed} scheduled retries`;
        }

        // Log the action
        await supabase.from('agent_decisions').insert({
            agent_id: 'payment-recovery',
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
        console.error('Payment Recovery Error:', error);
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
// HELPER: SEND RECOVERY EMAIL
// ============================================
async function sendRecoveryEmail(supabaseUrl: string, supabaseKey: string, data: any) {
    const billingPortalUrl = `https://billing.stripe.com/p/login/test_xxx`; // Replace with real portal

    const emailUrl = supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1/send-email');

    await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
            to: data.to,
            template: 'payment_failed',
            data: {
                name: data.name,
                attempt: data.attempt,
                billingPortalUrl: billingPortalUrl
            }
        })
    });
}

// ============================================
// HELPER: SEND CANCELLATION EMAIL
// ============================================
async function sendCancellationEmail(supabaseUrl: string, supabaseKey: string, data: any) {
    const emailUrl = supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1/send-email');

    await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
            to: data.to,
            subject: 'המנוי שלך בוטל - Kosmoi',
            html: `
                <div dir="rtl" style="font-family: sans-serif; max-width: 500px; margin: auto; text-align: right;">
                    <h2>היי ${data.name},</h2>
                    <p>לצערנו, לא הצלחנו לגבות את התשלום לאחר 3 ניסיונות.</p>
                    <p>המנוי שלך ב-Kosmoi בוטל.</p>
                    <p>אם זו טעות, אתה יכול להצטרף מחדש בכל עת:</p>
                    <p><a href="https://kosmoi.site/pricing" 
                          style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
                        הצטרפו מחדש
                    </a></p>
                    <p style="color: #888;">תודה שהיית איתנו! 💜</p>
                </div>
            `
        })
    });
}
