
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "https://esm.sh/web-push@3.6.3"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { title, body, url, user_id } = await req.json()

        // Init Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Init WebPush
        const vapidKeys = {
            publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
            privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!
        }

        // Validate Keys
        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            throw new Error("Missing VAPID Keys in Edge Function Env");
        }

        webpush.setVapidDetails(
            'mailto:admin@kosmoi.site',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        )

        // Fetch User Subscriptions
        const { data: subscriptions, error } = await supabaseClient
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id)

        if (error || !subscriptions || subscriptions.length === 0) {
            console.log(`No subscriptions found for user ${user_id}`)
            return new Response(JSON.stringify({ message: "No subscriptions" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Send Notifications
        const notificationPayload = JSON.stringify({ title, body, url })

        const promises = subscriptions.map((sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }
            return webpush.sendNotification(pushSubscription, notificationPayload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Expired subscription, delete it
                        console.log(`Deleting expired subscription ${sub.id}`)
                        return supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
                    }
                    console.error("Push Error:", err)
                })
        })

        await Promise.all(promises)

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
