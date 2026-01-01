
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

const toDateTime = (secs: number) => {
    var t = new Date('1970-01-01T00:30:00Z') // Unix epoch start.
    t.setSeconds(secs)
    return t
}

const manageSubscriptionStatusChange = async (
    subscriptionId: string,
    customerId: string,
    createAction = false
) => {
    // Get customer's UUID from mapping table.
    const { data: customerData, error: noCustomerError } = await supabase
        .from('customers')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
    if (noCustomerError) throw noCustomerError

    const { id: uuid } = customerData!

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method']
    })
    // Upsert the latest status of the subscription object.
    const subscriptionData = {
        id: subscription.id,
        user_id: uuid,
        metadata: subscription.metadata,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        //TODO check quantity on subscription
        // @ts-ignore
        quantity: subscription.quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
        canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
        current_period_start: toDateTime(subscription.current_period_start).toISOString(),
        current_period_end: toDateTime(subscription.current_period_end).toISOString(),
        created: toDateTime(subscription.created).toISOString(),
        ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
        trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
        trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
    }

    const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData)
    if (error) throw error
    console.log(`Inserted/updated subscription [${subscription.id}] for user [${uuid}]`)
}

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
            if (session.mode === 'subscription') {
                const subscriptionId = session.subscription
                await manageSubscriptionStatusChange(subscriptionId as string, session.customer as string, true)
            } else if (session.type === 'topup' || session.metadata?.type === 'topup') {
                // Legacy / Topup logic
                const { type, userId } = session.metadata || {}
                // RPC
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
        } else if (event.type === 'customer.subscription.created') {
            const subscription = event.data.object as any
            await manageSubscriptionStatusChange(subscription.id, subscription.customer as string, true)
        } else if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as any
            await manageSubscriptionStatusChange(subscription.id, subscription.customer as string)
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as any
            await manageSubscriptionStatusChange(subscription.id, subscription.customer as string)
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
