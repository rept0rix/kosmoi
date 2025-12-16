/**
 * StripeService
 * Handles payment processing and link generation.
 * Currently running in "Sandbox Mode" (Mocking calls).
 */
export const StripeService = {

    /**
     * Generate a Mock Payment Link
     * @param {string} businessName 
     * @param {string} productName
     * @param {number} amount
     * @param {string} currency
     * @param {string} planType 'basic' | 'pro' | 'enterprise'
     */
    createPaymentLink: async (businessName, productName = 'Product', amount = 100, currency = 'usd', planType = 'pro') => {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // In production, this would call your backend to generate a real Stripe Checkout Session
        // Encoding params into URL for mock verification
        const mockLink = `https://checkout.stripe.com/pay/${planType}_${btoa(businessName).slice(0, 5)}?product=${encodeURIComponent(productName)}&amount=${amount}&currency=${currency}`;

        return {
            url: mockLink,
            start_url: mockLink, // For consistency
            status: 'active',
            product: productName,
            amount: amount,
            currency: currency
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
    },

    /**
     * Process a Mock Payment (Top-up)
     * @param {string} userId
     * @param {number} amount
     */
    processMockPayment: async (userId, amount) => {
        console.log(`[Stripe Mock] Processing payment of ${amount} for user ${userId}`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

        // Success! Now fund the wallet.
        try {
            // Dynamic import to avoid circular dependency if any, 
            // though PaymentService doesn't import StripeService so it's fine.
            const { PaymentService } = await import('./PaymentService');
            await PaymentService.addCredits(userId, amount);
            return { success: true, transactionId: 'tx_' + Math.random().toString(36).substr(2, 9) };
        } catch (error) {
            console.error("Mock payment failed:", error);
            throw error;
        }
    }
};
