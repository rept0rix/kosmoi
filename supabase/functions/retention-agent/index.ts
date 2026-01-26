// @ts-nocheck
/**
 * RETENTION AGENT
 * 
 * The autonomous agent responsible for trial retention and user re-engagement.
 * Runs daily via cron job or can be triggered manually.
 * 
 * Actions:
 * 1. Find trials ending in 7 days → Send reminder
 * 2. Find trials ending in 2 days → Send urgent + discount
 * 3. Find expired trials today → Send winback email
 * 4. Find inactive users (3+ days) → Send re-engagement
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helpers
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));

console.log('🤖 Retention Agent Starting...');

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Parse action from request body
        let action = 'FULL_RUN';
        try {
            const body = await req.json();
            action = body.action || 'FULL_RUN';
        } catch (e) {
            // No body = full run
        }

        const now = new Date();
        const results = {
            action: action,
            reminders_sent: 0,
            urgent_sent: 0,
            expired_sent: 0,
            reengagement_sent: 0,
            stale_leads_processed: 0,
            errors: [] as string[]
        };

        // ============================================
        // ACTION: PROCESS_STALE_LEADS (Called by CEO)
        // ============================================
        if (action === 'PROCESS_STALE_LEADS') {
            const staleTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            const { data: staleLeads } = await supabase
                .from('leads')
                .select('*, service_providers!inner(business_name)')
                .eq('status', 'new')
                .lt('created_at', staleTime)
                .limit(10);

            for (const lead of staleLeads || []) {
                // Update lead status to follow_up
                await supabase
                    .from('leads')
                    .update({ status: 'follow_up', notes: 'Auto-followed up by Retention Agent' })
                    .eq('id', lead.id);

                // Notify the business owner
                if (lead.service_providers?.email) {
                    await sendEmail(supabaseUrl, supabaseKey, {
                        to: lead.service_providers.email,
                        subject: `🔔 תזכורת: יש לך lead שמחכה!`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
                                <h2>יש לך lead שמחכה 48+ שעות!</h2>
                                <p>שם: ${lead.name || 'לא ידוע'}</p>
                                <p>סוג: ${lead.type || 'פנייה כללית'}</p>
                                <p><a href="https://kosmoi.site/dashboard/leads" 
                                      style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
                                    צפה ב-Lead →
                                </a></p>
                            </div>
                        `
                    });
                }
                results.stale_leads_processed++;
            }

            // Log and return
            await supabase.from('agent_decisions').insert({
                agent_id: 'retention-agent',
                decision_type: action,
                action: results,
                success: true
            });

            return new Response(JSON.stringify({ success: true, results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // ============================================
        // ACTION: SEND_TRIAL_REMINDERS (Called by CEO)
        // ============================================
        if (action === 'SEND_TRIAL_REMINDERS') {
            // Send to trials expiring in 1-3 days
            const in3Days = addDays(now, 3);
            const { data: expiringTrials } = await supabase
                .from('subscriptions')
                .select('*, users!inner(id, email, full_name)')
                .eq('status', 'trial')
                .lte('trial_ends_at', in3Days.toISOString())
                .gte('trial_ends_at', now.toISOString());

            for (const sub of expiringTrials || []) {
                const daysLeft = daysBetween(now, new Date(sub.trial_ends_at));
                await sendEmail(supabaseUrl, supabaseKey, {
                    to: sub.users.email,
                    template: daysLeft <= 1 ? 'trial_ending' : 'trial_reminder',
                    data: {
                        name: sub.users.full_name || sub.users.email,
                        daysLeft: daysLeft
                    }
                });
                results.reminders_sent++;
            }

            await supabase.from('agent_decisions').insert({
                agent_id: 'retention-agent',
                decision_type: action,
                action: results,
                success: true
            });

            return new Response(JSON.stringify({ success: true, results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // ============================================
        // FULL_RUN: Original behavior (all actions)

        // ============================================
        // 1. TRIALS ENDING IN 7 DAYS → REMINDER
        // ============================================
        const in7Days = addDays(now, 7);
        const in6Days = addDays(now, 6);

        const { data: ending7Days, error: err1 } = await supabase
            .from('subscriptions')
            .select('*, users!inner(id, email, full_name)')
            .eq('status', 'trial')
            .gte('trial_ends_at', in6Days.toISOString())
            .lte('trial_ends_at', in7Days.toISOString());

        if (err1) {
            results.errors.push(`7-day query error: ${err1.message}`);
        } else if (ending7Days) {
            for (const sub of ending7Days) {
                try {
                    await sendEmail(supabaseUrl, supabaseKey, {
                        to: sub.users.email,
                        template: 'trial_reminder',
                        data: {
                            name: sub.users.full_name || sub.users.email,
                            daysLeft: 7
                        }
                    });
                    results.reminders_sent++;
                    console.log(`📧 7-day reminder sent to ${sub.users.email}`);
                } catch (e: any) {
                    results.errors.push(`Email to ${sub.users.email}: ${e.message}`);
                }
            }
        }

        // ============================================
        // 2. TRIALS ENDING IN 2 DAYS → URGENT + DISCOUNT
        // ============================================
        const in2Days = addDays(now, 2);
        const in1Day = addDays(now, 1);

        const { data: ending2Days, error: err2 } = await supabase
            .from('subscriptions')
            .select('*, users!inner(id, email, full_name)')
            .eq('status', 'trial')
            .gte('trial_ends_at', in1Day.toISOString())
            .lte('trial_ends_at', in2Days.toISOString());

        if (err2) {
            results.errors.push(`2-day query error: ${err2.message}`);
        } else if (ending2Days) {
            for (const sub of ending2Days) {
                try {
                    await sendEmail(supabaseUrl, supabaseKey, {
                        to: sub.users.email,
                        template: 'trial_ending',
                        data: {
                            name: sub.users.full_name || sub.users.email,
                            daysLeft: 2
                        }
                    });
                    results.urgent_sent++;
                    console.log(`🚨 Urgent email sent to ${sub.users.email}`);
                } catch (e: any) {
                    results.errors.push(`Email to ${sub.users.email}: ${e.message}`);
                }
            }
        }

        // ============================================
        // 3. EXPIRED TODAY → WINBACK EMAIL
        // ============================================
        const yesterday = addDays(now, -1);

        const { data: expiredToday, error: err3 } = await supabase
            .from('subscriptions')
            .select('*, users!inner(id, email, full_name)')
            .eq('status', 'trial')
            .gte('trial_ends_at', yesterday.toISOString())
            .lte('trial_ends_at', now.toISOString());

        if (err3) {
            results.errors.push(`Expired query error: ${err3.message}`);
        } else if (expiredToday) {
            for (const sub of expiredToday) {
                try {
                    // Update status to expired
                    await supabase
                        .from('subscriptions')
                        .update({ status: 'expired' })
                        .eq('id', sub.id);

                    await sendEmail(supabaseUrl, supabaseKey, {
                        to: sub.users.email,
                        template: 'trial_expired',
                        data: {
                            name: sub.users.full_name || sub.users.email
                        }
                    });
                    results.expired_sent++;
                    console.log(`😢 Expired email sent to ${sub.users.email}`);
                } catch (e: any) {
                    results.errors.push(`Email to ${sub.users.email}: ${e.message}`);
                }
            }
        }

        // ============================================
        // 4. INACTIVE USERS (3+ DAYS) → RE-ENGAGEMENT
        // ============================================
        const threeDaysAgo = addDays(now, -3);

        const { data: inactiveUsers, error: err4 } = await supabase
            .from('users')
            .select('id, email, full_name, last_sign_in_at')
            .lt('last_sign_in_at', threeDaysAgo.toISOString())
            .gt('last_sign_in_at', addDays(now, -7).toISOString()); // Only 3-7 days inactive

        if (err4) {
            results.errors.push(`Inactive query error: ${err4.message}`);
        } else if (inactiveUsers) {
            for (const user of inactiveUsers) {
                // Check if we already sent re-engagement email recently
                const { data: recentEmail } = await supabase
                    .from('email_logs')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('template', 'reengagement')
                    .gte('created_at', threeDaysAgo.toISOString())
                    .limit(1);

                if (!recentEmail || recentEmail.length === 0) {
                    try {
                        await sendEmail(supabaseUrl, supabaseKey, {
                            to: user.email,
                            subject: '👋 חסר לנו אותך ב-Kosmoi!',
                            html: `
                                <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
                                    <h2>היי ${user.full_name || ''}! 👋</h2>
                                    <p>שמנו לב שלא נכנסת ל-Kosmoi כמה ימים.</p>
                                    <p>יש לנו leads חדשים שמחכים לך! 🎯</p>
                                    <p><a href="https://kosmoi.site/dashboard" 
                                          style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
                                        חזרו לדאשבורד →
                                    </a></p>
                                </div>
                            `
                        });

                        // Log the email
                        await supabase.from('email_logs').insert({
                            user_id: user.id,
                            template: 'reengagement',
                            email: user.email
                        });

                        results.reengagement_sent++;
                        console.log(`👋 Re-engagement sent to ${user.email}`);
                    } catch (e: any) {
                        results.errors.push(`Email to ${user.email}: ${e.message}`);
                    }
                }
            }
        }

        // ============================================
        // LOG RESULTS
        // ============================================
        console.log('📊 Retention Agent Results:', results);

        // Store results for monitoring
        await supabase.from('agent_decisions').insert({
            agent_id: 'retention-agent',
            decision_type: 'daily_run',
            action: results,
            success: results.errors.length === 0,
            context: { timestamp: now.toISOString() }
        });

        return new Response(JSON.stringify({
            success: true,
            results,
            timestamp: now.toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Retention Agent Error:', error);
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
// HELPER: SEND EMAIL
// ============================================
async function sendEmail(supabaseUrl: string, supabaseKey: string, payload: any) {
    const emailUrl = supabaseUrl.replace('.supabase.co', '.supabase.co/functions/v1/send-email');

    const res = await fetch(emailUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Email failed: ${error}`);
    }

    return res.json();
}
