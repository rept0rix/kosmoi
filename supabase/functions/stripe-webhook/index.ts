
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";

/*
  Env Vars needed:
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SIGNING_SECRET
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
*/

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

    if (!signature || !webhookSecret) {
        return new Response("Webhook secret not configured or signature missing", { status: 400 });
    }

    let event;
    try {
        const body = await req.text();
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        console.log(`Processing event: ${event.type}`);
        switch (event.type) {
            case 'product.created':
            case 'product.updated':
                await upsertProduct(supabase, event.data.object);
                break;
            case 'price.created':
            case 'price.updated':
                await upsertPrice(supabase, event.data.object);
                break;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await manageSubscriptionStatusChange(
                    supabase,
                    subscription.id,
                    subscription.customer as string,
                    event.type === 'customer.subscription.created'
                );
                break;
            case 'checkout.session.completed':
                const session = event.data.object;
                if (session.mode === 'subscription') {
                    const subscriptionId = session.subscription as string;
                    await manageSubscriptionStatusChange(
                        supabase,
                        subscriptionId,
                        session.customer as string,
                        true
                    );
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err: any) {
        console.error(`Error processing webhook: ${err.message}`);
        return new Response(`Error processing webhook: ${err.message}`, { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200
    });
});

async function upsertProduct(supabase: any, product: any) {
    const productData = {
        id: product.id,
        active: product.active,
        name: product.name,
        description: product.description ?? null,
        image: product.images?.[0] ?? null,
        metadata: product.metadata,
    };

    const { error } = await supabase.from('products').upsert(productData);
    if (error) throw error;
    console.log(`Product upserted: ${product.id}`);
}

async function upsertPrice(supabase: any, price: any) {
    const priceData = {
        id: price.id,
        product_id: price.product,
        active: price.active,
        currency: price.currency,
        description: price.nickname ?? null,
        type: price.type,
        unit_amount: price.unit_amount ?? null,
        interval: price.recurring?.interval ?? null,
        interval_count: price.recurring?.interval_count ?? null,
        trial_period_days: price.recurring?.trial_period_days ?? null,
        metadata: price.metadata,
    };

    const { error } = await supabase.from('prices').upsert(priceData);
    if (error) throw error;
    console.log(`Price upserted: ${price.id}`);
}

async function manageSubscriptionStatusChange(
    supabase: any,
    subscriptionId: string,
    customerId: string,
    createAction = false
) {
    // Get customer's UUID from mapping table.
    const { data: customerData, error: noCustomerError } = await supabase
        .from('customers')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (noCustomerError) {
        console.error(`Customer lookup failed: ${noCustomerError.message}`);
        // If we don't have the customer mapping, we can't link the subscription to a user.
        // This might happen if the webhook fires before the client has created the mapping, but usually we create mapping before checkout.
        throw noCustomerError;
    }

    const { id: uuid } = customerData;

    // Retrieve latest subscription state from Stripe is safer, but here we just need to update status.
    // For 'deleted', status is 'canceled'.
    // We don't have the stripe client object handy to fetch fresh, so we rely on the event object passed.
    // BUT the event object for 'created' was passed as `event.data.object` in the switch.
    // Wait, I didn't pass the subscription object to this function, only ID.
    // I should update the function signature or fetch it.
    // Since I can't easily fetch without re-initializing stripe with 'await' inside this function or passing it, let's optimize to receive the object.
    // Actually, I can just use the status if I pass it content.

    // Let's refactor the function to fetch from Stripe directly, using the global stripe instance.
    // We need to re-fetch to ensure we have the very latest status and details.

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method']
    });

    const subscriptionData = {
        id: subscription.id,
        user_id: uuid,
        metadata: subscription.metadata,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        quantity: subscription.items.data[0].quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at) : null,
        canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at) : null,
        current_period_start: toDateTime(subscription.current_period_start),
        current_period_end: toDateTime(subscription.current_period_end),
        created: toDateTime(subscription.created),
        ended_at: subscription.ended_at ? toDateTime(subscription.ended_at) : null,
        trial_start: subscription.trial_start ? toDateTime(subscription.trial_start) : null,
        trial_end: subscription.trial_end ? toDateTime(subscription.trial_end) : null,
    };

    const { error } = await supabase.from('subscriptions').upsert(subscriptionData);
    if (error) throw error;
    console.log(`Subscription upserted: ${subscription.id} for ${uuid}`);
}

const toDateTime = (secs: number) => {
    return new Date(secs * 1000);
};
