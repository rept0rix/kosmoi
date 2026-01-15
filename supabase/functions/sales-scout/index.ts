import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// --- Configuration ---
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const N8N_WEBHOOK_URL = Deno.env.get('VITE_N8N_EMAIL_WEBHOOK')
const TEST_EMAIL = Deno.env.get('TEST_EMAIL') || 'admin@kosmoi.com'
const SENDER_EMAIL = 'Sarah <onboarding@resend.dev>'

// --- Template ---
const INVITATION_TEMPLATE = (businessName, trackingLinks) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
    body { margin: 0; padding: 0; font-family: 'Outfit', sans-serif; background-color: #0F172A; color: #F8FAFC; }
    .container { max-width: 600px; margin: 40px auto; background: #1E293B; border-radius: 24px; overflow: hidden; border: 1px solid #334155; }
    .hero { background: linear-gradient(135deg, #F59E0B 0%, #B45309 100%); padding: 48px 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; color: #FFFFFF; border: 2px solid rgba(255,255,255,0.3); display: inline-block; padding: 8px 16px; border-radius: 12px; margin-bottom: 8px; }
    .hero h1 { margin: 24px 0 0; color: #FFFFFF; font-size: 36px; }
    .content { padding: 48px 40px; }
    .greeting { font-size: 20px; color: #94A3B8; margin-bottom: 24px; }
    .lead-text { font-size: 18px; line-height: 1.6; color: #E2E8F0; margin-bottom: 32px; }
    .highlight { color: #FBBF24; font-weight: 600; }
    .card { background: #0F172A; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 32px; display: flex; gap: 16px; align-items: center; }
    .card-icon { font-size: 24px; width: 48px; height: 48px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .card-text { font-size: 15px; color: #CBD5E1; margin: 0; }
    .button { background: linear-gradient(to right, #F59E0B, #D97706); color: #FFF; padding: 18px 48px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 18px; display: inline-block; }
    .footer { background: #0F172A; padding: 32px; text-align: center; border-top: 1px solid #334155; }
    .footer p { margin: 8px 0; font-size: 13px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div class="logo">KOSMOI</div>
      <h1>Koh Samui is Calling.</h1>
    </div>
    <div class="content">
      <p class="greeting">Sawasdee <strong>${businessName}</strong>,</p>
      <p class="lead-text">Our 'Island Crawler' AI has specifically identified your business as a <span class="highlight">Hidden Gem</span>.</p>
      <div class="card">
        <div class="card-icon">💎</div>
        <p class="card-text">We've created a preliminary <strong>Premium Profile</strong> for you on Kosmoi - the new digital heart of the island.</p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${trackingLinks.click}" class="button">Claim Your Profile Free</a>
      </div>
      <p style="font-size: 13px; color: #64748B; text-align: center;">No credit card required. Verify ownership in 30 seconds.</p>
    </div>
    <div class="footer">
      <p>Sent autonomously by <strong>Sarah</strong> (AI Sales Coordinator)</p>
      <p>Protocol ID: 626-CLOUD • Node: SAMUI-SOUTH</p>
    </div>
    <!-- Open Tracking Pixel -->
    <img src="${trackingLinks.open}" alt="" width="1" height="1" style="display:none;" />
  </div>
</body>
</html>
`;

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log("🕵️‍♀️ Sarah (Cloud): Scouting...")

        // 1. Scout
        const { data: rawLeads } = await supabaseClient
            .from('service_providers')
            .select('id, business_name, phone, category, email')
            .eq('verified', false)
            .eq('status', 'active')
            .neq('category', 'culture')
            .neq('category', 'temple') // Filter
            .limit(5)

        if (!rawLeads || rawLeads.length === 0) return new Response(JSON.stringify({ message: "No leads" }), { headers: { "Content-Type": "application/json" } })

        let targetLead = null;
        for (const lead of rawLeads) {
            const { data: existing } = await supabaseClient
                .from('invitations')
                .select('id')
                .eq('service_provider_id', lead.id)
                .maybeSingle()
            if (!existing) { targetLead = lead; break; }
        }

        if (!targetLead) return new Response(JSON.stringify({ message: "All invited" }), { headers: { "Content-Type": "application/json" } })

        console.log(`💌 Target: ${targetLead.business_name}`)

        const recipientEmail = TEST_EMAIL || 'admin@kosmoi.com';

        // 2. INSERT INVITATION (Sending State)
        const { data: invite, error: dbError } = await supabaseClient
            .from('invitations')
            .insert({
                service_provider_id: targetLead.id,
                token: crypto.randomUUID(),
                status: 'pending', // Pending until clicked? Or 'sending' logic. DB default is pending.
                metadata: {
                    channel: 'email',
                    target_email: recipientEmail,
                    real_business_email: targetLead.email || 'unknown',
                    sender: 'sales-scout-cloud',
                    stage: 'sending'
                }
            })
            .select()
            .single()

        if (dbError) throw dbError

        // 3. Generate Tracking Links
        const baseUrl = Deno.env.get('SUPABASE_URL').replace('.co', '.co/functions/v1')
        const realClaimLink = `https://kosmoi.site/claim?id=${targetLead.id}`

        const trackingLinks = {
            open: `${baseUrl}/track-invitation?id=${invite.id}&type=open`,
            click: `${baseUrl}/track-invitation?id=${invite.id}&type=click&url=${encodeURIComponent(realClaimLink)}`
        }

        // 4. Generate Content
        const emailHtml = INVITATION_TEMPLATE(targetLead.business_name, trackingLinks)

        // 5. Send (n8n or Resend)
        let emailSent = false;
        // ... (n8n logic same as before, updated payload)
        if (N8N_WEBHOOK_URL && N8N_WEBHOOK_URL.startsWith('http')) {
            try {
                const n8nResp = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipientEmail,
                        subject: `Invitation for ${targetLead.business_name} - Kosmoi`,
                        html: emailHtml,
                        business_name: targetLead.business_name,
                        claim_link: trackingLinks.click, // Use tracking link for button text if needed
                        lead_id: targetLead.id,
                        phone: targetLead.phone,
                        from: SENDER_EMAIL
                    })
                })
                if (n8nResp.ok) emailSent = true;
            } catch (e) { console.error("n8n err", e) }
        }

        // ... (Resend logic same as before)
        if (!emailSent && RESEND_API_KEY) {
            try {
                const resendResp = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: SENDER_EMAIL,
                        to: recipientEmail,
                        subject: `Invitation for ${targetLead.business_name} - Kosmoi`,
                        html: emailHtml
                    })
                })
                if (resendResp.ok) emailSent = true;
            } catch (e) { console.error("Resend err", e) }
        }

        // 6. Update Status (or just log success)
        if (emailSent) {
            await supabaseClient.from('invitations').update({
                status: 'pending', // Remains pending until Clicked/Claimed.
                metadata: { ...invite.metadata, stage: 'sent', sent_at: new Date().toISOString() }
            }).eq('id', invite.id)

            console.log(`✅ Sent & Tracked: ${invite.id}`)
        } else {
            await supabaseClient.from('invitations').update({
                status: 'failed',
                metadata: { ...invite.metadata, stage: 'failed' }
            }).eq('id', invite.id)
            return new Response(JSON.stringify({ error: "Send Failed" }), { status: 500 })
        }

        return new Response(JSON.stringify({ success: true, invite_id: invite.id }), { headers: { "Content-Type": "application/json" } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
    }
})
