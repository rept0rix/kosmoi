
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/api/supabaseClient';

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
    }
};
