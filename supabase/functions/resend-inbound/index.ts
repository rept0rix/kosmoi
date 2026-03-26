// Follow this: https://supabase.com/docs/guides/functions/deploy
// 1. Create function: supabase functions new resend-inbound
// 2. Paste this code into supabase/functions/resend-inbound/index.ts
// 3. Deploy: supabase functions deploy resend-inbound --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables (Set these in Supabase Dashboard -> Edge Functions -> Secrets)
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Resend sends a POST request with a specific JSON structure
        // Info: https://resend.com/docs/dashboard/webhooks/incoming-emails
        const payload = await req.json();

        console.log("📨 Received Inbound Email:", payload);

        // Type extraction (basic)
        const from = payload.from;
        const to = payload.to;
        const subject = payload.subject;
        const text = payload.text;
        const html = payload.html;

        // Insert into 'inbound_emails' table
        const { error } = await supabase
            .from("inbound_emails")
            .insert({
                sender: from,
                recipient: to && Array.isArray(to) ? to[0] : "unknown",
                subject: subject,
                body_text: text,
                body_html: html,
                raw_payload: payload,
                processed_status: "unread",
            });

        if (error) {
            console.error("❌ Database Insert Error:", error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Signal: inbound email received — brain can detect replies, interest, and engagement
        await supabase.rpc('write_signal', {
            p_event_type: 'email.inbound_received',
            p_entity_type: 'system',
            p_entity_id: null,
            p_source: 'resend-inbound',
            p_data: {
                from,
                to: Array.isArray(to) ? to[0] : to,
                subject,
                has_text: !!text,
                has_html: !!html
            }
        }).catch(() => {}); // non-fatal

        // Trigger support-agent immediately (fire-and-forget, non-blocking)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/support-agent`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'PROCESS_UNREAD' }),
        }).catch(() => {}); // non-fatal — cron-worker will retry if this fails

        return new Response(JSON.stringify({ message: "Email processed successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("🚨 Worker Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
});
