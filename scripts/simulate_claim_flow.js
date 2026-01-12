
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Supabase Client (Service Role for Admin powers in simulation)
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateClaimFlow() {
    console.log("🕵️‍♂️ Starting Claim Flow Simulation...");

    // 1. Get a random unverified provider
    const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .is('stripe_account_id', null)
        .limit(1)
        .single();

    if (providerError || !provider) {
        console.error("❌ No unverified provider found.");
        return;
    }

    console.log(`📍 Found Provider: ${provider.business_name} (ID: ${provider.id})`);

    // 2. Create a Mock Invitation Token (In real app, this comes from email)
    // We'll mimic InvitationService.validateToken locally or just assume we have the ID to claim.
    // The core test is: Can we generate a link for THIS provider?

    // 3. Mimic the 'CreatePaymentLink' call from the frontend
    // This usually calls a Supabase Edge Function 'create-checkout-session' or similar.
    // Let's invoke the function directly via standard fetch or supabase.functions if available in node.
    // Since supabase-js in Node doesn't support .functions.invoke seamlessly with local edge functions usually without setup, 
    // We will use the 'test_payment_generation.js' logic but adapted for this specific provider data.

    console.log("🔗 Generating Payment Link for 1 THB...");

    try {
        // Dynamic import of Stripe
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Create Verification Product
        const product = await stripe.products.create({
            name: `Claim Profile: ${provider.business_name}`,
            metadata: {
                providerId: provider.id,
                type: 'claim_profile'
            }
        });

        const price = await stripe.prices.create({
            currency: 'thb',
            unit_amount: 3500, // 35.00 THB (Minimum for Stripe is ~10THB)
            product: product.id,
        });

        const paymentLink = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            after_completion: {
                type: 'redirect',
                redirect: { url: 'http://Kar1s-MacBook-Pro.local:5173/claim/success' }
            },
            metadata: {
                providerId: provider.id
            }
        });

        console.log("✅ Payment Link Generated Successfully:");
        console.log(paymentLink.url);

    } catch (err) {
        console.error("❌ Payment Generation Failed:", err.message);
    }
}

simulateClaimFlow();
