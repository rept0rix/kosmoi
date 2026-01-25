
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../../api/supabaseClient.js';

let stripePromise;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

export const StripeService = {
    /**
     * Redirects to Stripe Checkout for the given price.
     */
    checkoutSubscription: async (priceId, mode = 'subscription') => {
        try {
            const response = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId, mode }
            });

            if (response.error) throw response.error;
            // @ts-ignore
            const data = response.data;

            if (!data?.sessionId) throw new Error("No session ID returned from backend");

            const { sessionId } = data;
            const stripe = await getStripe();
            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

            if (stripeError) throw stripeError;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    /**
     * Redirects to Stripe Customer Portal.
     */
    openCustomerPortal: async () => {
        try {
            const response = await supabase.functions.invoke('create-portal-link');
            if (response.error) throw response.error;
            // @ts-ignore
            const url = response.data?.url;

            window.location.assign(url);
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    /**
     * Checks if the user has an active Pro subscription.
     */
    getSubscription: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('*, prices(*, products(*))')
                .in('status', ['trialing', 'active'])
                .single();

            return subscription;
        } catch (error) {
            console.error('Error fetching subscription:', error);
            return null;
        }
    },

    /**
     * Creates a payment link.
     * Supports Server-Side (Node.js) execution via direct Stripe SDK.
     */
    createPaymentLink: async (business, product, amount, currency = 'usd') => {
        // Check for Server-Side Environment (Node.js) with Secret Key
        const secretKey = typeof globalThis !== 'undefined' && globalThis.process?.env?.STRIPE_SECRET_KEY;
        if (secretKey) {
            try {
                console.log(`[StripeService] Creating real payment link for '${product}' ($${amount})`);

                // Dynamic import to prevent client-side build errors
                const { default: Stripe } = await import('stripe');
                const stripe = new Stripe(secretKey);

                const priceRecord = await stripe.prices.create({
                    currency: currency,
                    unit_amount: Math.round(amount * 100), // Convert to cents
                    product_data: { name: product },
                });

                const paymentLink = await stripe.paymentLinks.create({
                    line_items: [{ price: priceRecord.id, quantity: 1 }],
                });

                return paymentLink.url;
            } catch (error) {
                console.error('[StripeService] Error creating payment link:', error);
                throw error;
            }
        }

        // Fallback for Client-Side (or missing key)
        console.warn("[StripeService] Client-side payment generation requires Edge Function (not implemented).");
        throw new Error("Cannot create payment link: Missing 'STRIPE_SECRET_KEY' or running on client without Edge Function.");
    },

    /**
     * Initiates the Stripe Connect onboarding flow for a service provider.
     */
    createConnectAccount: async (providerId) => {
        try {
            console.log(`[StripeService] Initiating Connect for ${providerId}`);
            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('create-connect-account', {
                body: {
                    providerId,
                    redirectUrl: window.location.origin + '/admin/businesses'
                }
            });

            if (error) throw error;
            if (!data?.url) throw new Error("No onboarding URL returned.");

            // Redirect user to Stripe
            window.location.href = data.url;
        } catch (error) {
            console.error('[StripeService] Connect Error:', error);
            throw error;
        }
    }
};
