/**
 * StripeService
 * Handles payment processing and link generation.
 * Currently running in "Sandbox Mode" (Mocking calls).
 */
export const StripeService = {

    /**
     * Generate a Mock Payment Link
     * @param {string} businessName 
     * @param {string} planType 'basic' | 'pro' | 'enterprise'
     */
    createPaymentLink: async (businessName, planType = 'pro') => {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // In production, this would call your backend to generate a real Stripe Checkout Session
        const mockLink = `https://checkout.stripe.com/pay/${planType}_${btoa(businessName).slice(0, 5)}`;
        return {
            url: mockLink,
            status: 'active'
        };
    },

    /**
     * Send Payment Link via Email (Mock)
     * @param {string} email
     * @param {string} link
     */
    sendInvoice: async (email, link) => {
        console.log(`[Stripe Mock] Sending invoice to ${email}: ${link}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }
};
