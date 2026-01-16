import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PIXEL = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
    0x01, 0x00, 0x3b
]);

serve(async (req) => {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const type = url.searchParams.get('type') // 'open' or 'click'
    const targetUrl = url.searchParams.get('url')

    if (!id) {
        return new Response("Missing ID", { status: 400 })
    }

    // Init Client (Service Role needed to bypass RLS if public user can't write)
    // Actually, invitations are public read but maybe not write. Using Service Role for safety.
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        if (type === 'open') {
            // Update opened_at if null
            // We use rpc or raw update. 
            // Let's just update. "First open" is usually what matters, effectively min(opened_at).
            // If we want every open, we overwrite. Let's overwrite for now or check if null.
            // Simple update:
            await supabase
                .from('invitations')
                .update({ opened_at: new Date().toISOString() })
                .eq('id', id)
                .is('opened_at', null) // Only track first open for accuracy? Or just update always. 
            // Let's update always to know "last seen", OR strictly first. 
            // "opened_at" usually implies first open.

            return new Response(PIXEL, {
                headers: {
                    "Content-Type": "image/gif",
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                }
            })
        }
        else if (type === 'click') {
            if (!targetUrl) return new Response("Missing URL", { status: 400 })

            // Update clicked_at + status
            await supabase
                .from('invitations')
                .update({
                    clicked_at: new Date().toISOString(),
                    status: 'clicked'
                })
                .eq('id', id)

            // Redirect
            return Response.redirect(targetUrl, 302)
        }

        return new Response("Invalid Type", { status: 400 })

    } catch (err) {
        console.error("Track Error:", err)
        // If error, fail gracefully for user (redirect anyway if click, show pixel if open)
        if (type === 'click' && targetUrl) return Response.redirect(targetUrl, 302)
        return new Response(PIXEL, { headers: { "Content-Type": "image/gif" } })
    }
})
