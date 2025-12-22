
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
    checkoutSubscription: async (priceId) => {
        try {
            const { data: { sessionId }, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId: priceId }
            });

            if (error) throw error;

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
            const { data: { url }, error } = await supabase.functions.invoke('create-portal-link');
            if (error) throw error;

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
        if (typeof process !== 'undefined' && process.env && process.env.STRIPE_SECRET_KEY) {
            try {
                console.log(`[StripeService] Creating real payment link for '${product}' ($${amount})`);
                
                // Dynamic import to prevent client-side build errors
                const { default: Stripe } = await import('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    }
};
