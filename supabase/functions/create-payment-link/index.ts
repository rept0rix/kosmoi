// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
        if (!STRIPE_SECRET_KEY) {
            throw new Error('Missing STRIPE_SECRET_KEY');
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        });

        const { name, amount, currency = 'thb', quantity = 1, success_url, cancel_url, metadata = {} } = await req.json();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: name,
                        },
                        unit_amount: Math.round(amount * 100), // Amount in cents/satang
                    },
                    quantity: quantity,
                },
            ],
            mode: 'payment',
            success_url: success_url || 'https://kosmoi.site/success',
            cancel_url: cancel_url || 'https://kosmoi.site/cancel',
            metadata: metadata, // Pass metadata to Stripe
        });

        return new Response(JSON.stringify({ url: session.url, id: session.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
