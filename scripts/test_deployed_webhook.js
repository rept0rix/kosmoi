
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });


const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzjzeywhqbwppfxqkptf.supabase.co';
// Using the Service Role Key found in previous context to ensure permissions for test setup
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;


const supabase = createClient(supabaseUrl, supabaseKey);
// Initialize Stripe purely to generate the signature
const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

// Function URL
const FUNCTION_URL = `${supabaseUrl}/functions/v1/stripe-webhook`; // Adjust if using custom domain, usually standard for supabase

async function runIntegrationTest() {
    console.log(`🚀 Starting Deployed Webhook Test...`);
    console.log(`   Target: ${FUNCTION_URL}`);

    // 1. Create Test Provider
    const testProviderId = `test-webhook-${Date.now()}`;
    const { data: provider, error: createError } = await supabase
        .from('service_providers')
        .insert({
            business_name: `Webhook Test Business ${Date.now()}`,
            category: 'Restaurants',
            description: 'Integration test for deployed webhook',
            status: 'active',
            claimed: false,
            stripe_status: 'restricted'
        })
        .select()
        .single();

    if (createError) {
        console.error("❌ Failed to create test provider:", createError);
        return;
    }
    console.log(`✅ [1/4] Created Test Provider: ${provider.business_name} (ID: ${provider.id})`);

    // 2. Prepare Payload
    const testUserId = "2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e"; // Real User ID from before
    const mockSessionId = `sess_live_test_${Date.now()}`;

    // Construct the payload exactly as Stripe sends it
    const payload = {
        id: `evt_test_${Date.now()}`,
        object: 'event',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: mockSessionId,
                object: 'checkout.session',
                amount_total: 3500,
                currency: 'thb',
                mode: 'payment',
                metadata: {
                    type: 'claim_profile',
                    providerId: provider.id,
                    userId: testUserId
                }
            }
        }
    };

    const payloadString = JSON.stringify(payload, null, 2);

    // 3. Generate Stripe Signature
    // Stripe signatures are timestamp + signature of (timestamp.payload)
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payloadString}`;

    // Use Stripe library or crypto to sign? 
    // Stripe library:
    const signature = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: webhookSecret,
    });

    // 4. Send Request
    console.log(`🔄 [2/4] Sending POST request to deployed function...`);
    try {
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': signature
            },
            body: payloadString
        });

        console.log(`   Response Status: ${response.status}`);
        const text = await response.text();
        console.log(`   Response Body: ${text}`);

        if (response.status !== 200) {
            console.error("❌ Webhook returned non-200 status.");
        }

    } catch (e) {
        console.error("❌ Network error calling webhook:", e);
    }

    // 5. Verify Database
    console.log(`🔍 [3/4] Verifying Database Updates...`);
    // Wait a moment for async processing if needed (Edge Functions are usually fast but just in case)
    await new Promise(r => setTimeout(r, 2000));

    const { data: finalProvider, error: fetchError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', provider.id)
        .single();

    if (fetchError) {
        console.error("❌ Failed to fetch final provider:", fetchError);
        return;
    }

    if (finalProvider.claimed === true && finalProvider.stripe_status === 'verified') {
        console.log(`✅ [4/4] SUCCESS! The deployed webhook updated the database.`);
        console.log(`   Provider is claimed by ${finalProvider.owner_id}`);

        // Cleanup
        console.log("🧹 Cleaning up...");
        await supabase.from('service_providers').delete().eq('id', provider.id);
        console.log("   Done.");

    } else {
        console.error("❌ FAILURE. Database was NOT updated correctly.");
        console.log("   Final State:", finalProvider);
    }
}

runIntegrationTest();
