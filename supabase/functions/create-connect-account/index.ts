// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Stripe } from "https://esm.sh/stripe@12.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { providerId, redirectUrl } = await req.json()

        if (!providerId) {
            throw new Error('Missing providerId')
        }

        console.log(`Creating Connect Account for Provider: ${providerId}`)

        // 1. Check if provider already has an account
        const { data: provider, error: dbError } = await supabase
            .from('service_providers')
            .select('stripe_account_id, business_name, email')
            .eq('id', providerId)
            .single()

        if (dbError || !provider) {
            throw new Error('Provider not found')
        }

        let accountId = provider.stripe_account_id

        // 2. Create Stripe Account if not exists
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'TH', // Defaulting to Thailand for Samui
                email: provider.email || undefined,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_profile: {
                    name: provider.business_name,
                    url: 'https://kosmoi.site', // Fallback URL
                }
            })
            accountId = account.id

            // Save to DB
            await supabase
                .from('service_providers')
                .update({ stripe_account_id: accountId })
                .eq('id', providerId)
        }

        // 3. Create Account Link for Onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${redirectUrl || 'https://kosmoi.site/admin'}?refresh=true`,
            return_url: `${redirectUrl || 'https://kosmoi.site/admin'}?success=true`,
            type: 'account_onboarding',
        })

        return new Response(
            JSON.stringify({ url: accountLink.url, accountId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
