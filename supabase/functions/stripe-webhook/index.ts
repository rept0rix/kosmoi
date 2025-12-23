
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from "https://esm.sh/stripe@12.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log("Stripe Webhook Function Initialized")

serve(async (req: Request) => {
    try {
        const signature = req.headers.get('Stripe-Signature')
        const body = await req.text()

        // Verify the signature
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
            undefined,
            cryptoProvider // Required for Deno
        )

        console.log(`Event received: ${event.type}`)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any
            const { type, userId } = session.metadata || {} // Metadata passed from create-topup-session

            // For top-ups, we credit the wallet
            if (type === 'topup') {
                // We need userId. If not passed in metadata, lookup via customer or email.
                // Assuming we pass it in metadata for now.

                // Use RPC to add funds securely
                const { error } = await supabase.rpc('process_transaction', {
                    p_user_id: userId, // Needs to be passed in metadata!
                    p_amount: session.amount_total ? session.amount_total / 100 : 0,
                    p_type: 'topup',
                    p_reference_id: session.id,
                    p_metadata: session
                })

                if (error) {
                    console.error('Failed to process transaction', error)
                    return new Response('Error processing transaction', { status: 500 })
                }
                console.log(`Topup credited for user ${userId}`)
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }
})
