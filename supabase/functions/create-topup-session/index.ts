
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Create Topup Session Function Initialized")

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, currency = 'thb', mode = 'payment', returnUrl } = await req.json()

        // Get the user from the authorization header
        // In a real scenario, Supabase Auth context is passed via headers/JWT
        // For now, we assume the client passed the user_id or we decode the JWT if needed.
        // However, best practice is to trust the JWT.

        // Simplification: We expect the client to be authenticated, 
        // and we can get the user ID from the user object if we parse the JWT, 
        // but for this MVP code we will trust the caller or rely on metadata.
        // Ideally: const authHeader = req.headers.get('Authorization')!
        // const token = authHeader.replace('Bearer ', '')
        // const { data: { user } } = await supabase.auth.getUser(token)

        if (!amount) {
            throw new Error('Missing amount')
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: 'Wallet Top Up',
                            description: `Add ${amount} ${currency.toUpperCase()} to wallet`,
                        },
                        unit_amount: Math.round(amount * 100), // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${returnUrl || 'http://localhost:5173/wallet'}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl || 'http://localhost:5173/wallet'}?canceled=true`,
            metadata: {
                type: 'topup',
                // In real app, attach user_id from auth context
            },
        })

        return new Response(
            JSON.stringify({ sessionId: session.id, url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})

