// @ts-nocheck
/**
 * 🎉 ONBOARDING AGENT
 *
 * Triggered by cron-worker when a claim.payment_completed signal is detected.
 * Sends a personalised welcome email to the business owner with:
 *  1. Confirmation their profile is now live
 *  2. Dashboard link to complete their profile
 *  3. 3 concrete next steps
 *  4. What Kosmoi will do for them automatically
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SENDER = 'Kosmoi Team <onboarding@kosmoi.site>';

const welcomeEmail = (businessName: string, dashboardUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .logo { font-size: 28px; font-weight: 800; color: #f59e0b; margin-bottom: 32px; }
    h1 { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    p { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px; }
    .highlight { color: #f59e0b; font-weight: 600; }
    .step { background: #1e293b; border-left: 4px solid #f59e0b; padding: 16px 20px; margin-bottom: 12px; border-radius: 4px; }
    .step-num { font-size: 12px; color: #f59e0b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .step-title { font-size: 16px; font-weight: 600; color: #fff; }
    .step-desc { font-size: 14px; color: #94a3b8; margin-top: 4px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 9999px; text-decoration: none; margin: 24px 0; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 13px; color: #475569; }
    .auto-badge { background: #0f2d1a; border: 1px solid #16a34a; color: #4ade80; font-size: 12px; padding: 6px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Kosmoi ✦</div>

    <div class="auto-badge">✓ Profile Verified & Live</div>

    <h1>Welcome to Kosmoi, <span class="highlight">${businessName}</span>!</h1>

    <p>Your business is now verified and visible to thousands of visitors discovering Koh Samui every day. Here's what happens next:</p>

    <div class="step">
      <div class="step-num">Step 1</div>
      <div class="step-title">Complete your profile</div>
      <div class="step-desc">Add photos, description, opening hours and services. Businesses with full profiles get 3× more clicks.</div>
    </div>

    <div class="step">
      <div class="step-num">Step 2</div>
      <div class="step-title">Enable booking (optional)</div>
      <div class="step-desc">Allow customers to book directly through Kosmoi. We handle reminders and confirmations automatically.</div>
    </div>

    <div class="step">
      <div class="step-num">Step 3</div>
      <div class="step-title">Watch your analytics</div>
      <div class="step-desc">Your dashboard shows profile views, booking requests, and how customers found you.</div>
    </div>

    <a href="${dashboardUrl}" class="cta">Open My Dashboard →</a>

    <p style="font-size:14px; color:#64748b;">
      <strong style="color:#94a3b8;">What Kosmoi does for you automatically:</strong><br>
      We'll send you booking notifications, review alerts, and monthly performance reports.
      Our AI will also suggest improvements to help you rank higher on the platform.
    </p>

    <div class="footer">
      Questions? Reply to this email and our team will get back to you within 24 hours.<br>
      <a href="https://kosmoi.site" style="color:#f59e0b;">kosmoi.site</a> · Koh Samui, Thailand
    </div>
  </div>
</body>
</html>
`;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const body = await req.json().catch(() => ({}));
        const { provider_id, user_id } = body;

        // Fetch provider details
        const { data: provider, error: provErr } = await supabase
            .from('service_providers')
            .select('id, business_name, email, owner_id')
            .eq('id', provider_id)
            .single();

        if (provErr || !provider) {
            return new Response(JSON.stringify({ error: 'Provider not found', provider_id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
            });
        }

        // Fetch owner email from profiles / auth
        let ownerEmail = provider.email;
        if (!ownerEmail && (user_id || provider.owner_id)) {
            const uid = user_id || provider.owner_id;
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', uid)
                .maybeSingle();
            ownerEmail = profile?.email;
        }

        if (!ownerEmail) {
            console.warn(`[onboarding] No email for provider ${provider_id}`);
            await supabase.rpc('write_signal', {
                p_event_type: 'onboarding.no_email',
                p_entity_id: provider_id,
                p_metadata: { business_name: provider.business_name }
            }).catch(() => {});
            return new Response(JSON.stringify({ skipped: true, reason: 'no_email' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const dashboardUrl = `https://kosmoi.site/provider/dashboard?id=${provider_id}`;
        const html = welcomeEmail(provider.business_name, dashboardUrl);

        const sendResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: SENDER,
                to: ownerEmail,
                subject: `Welcome to Kosmoi — ${provider.business_name} is now live! 🎉`,
                html,
            })
        });

        const sendData = await sendResp.json();

        if (!sendResp.ok) {
            throw new Error(`Resend error: ${JSON.stringify(sendData)}`);
        }

        await supabase.rpc('write_signal', {
            p_event_type: 'onboarding.welcome_sent',
            p_entity_id: provider_id,
            p_metadata: { to: ownerEmail, business_name: provider.business_name, resend_id: sendData.id }
        }).catch(() => {});

        console.log(`[onboarding] ✅ Welcome sent to ${ownerEmail} for ${provider.business_name}`);

        return new Response(JSON.stringify({ success: true, to: ownerEmail, resend_id: sendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('[onboarding] Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
        });
    }
});
