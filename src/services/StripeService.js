// src/services/StripeService.js

export const StripeService = {
  createPaymentLink: async (data) => {
    // In a real implementation, this would call the Stripe API to create a payment link.
    // For now, we'll just return the mock URL you gave.
    console.log("Creating payment link with data:", data);
    const paymentLink = "https://buy.stripe.com/test_aFaaEQ4tc68pdT12Mb5wI05"; // Replace with actual Stripe API call
    return { url: paymentLink };
  },
};
