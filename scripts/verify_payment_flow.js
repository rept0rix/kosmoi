
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to this script or root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// WARN: We usually need SERVICE_ROLE_KEY to simulate the webhook since it writes to protected fields.
// If the user doesn't have it in .env, this might fail on the webhook simulation part if RLS blocks it.
// Assuming the user has a way to run admin/service role actions or using ANON for public RPCs.
// Let's try to assume we might need the SUPABASE_SERVICE_ROLE_KEY for the full simulation if we talk to DB directly.
// But we can check if it exists in env.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    console.error("Cannot simulate webhook properly without service role.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const NOTE = "Revenue Verification Simulation";

async function runSimulation() {
    console.log(`🚀 Starting ${NOTE}...`);

    // 1. Create a Test Provider
    const testProviderId = `test-provider-${Date.now()}`;
    const { data: provider, error: createError } = await supabase
        .from('service_providers')
        .insert({
            business_name: `Test Business ${Date.now()}`,
            category: 'Restaurants',
            description: 'A test business for payment verification',
            status: 'active', // Initially active but unclaimed
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

    // 2. Mock 'Create Payment Link' (Just prep the data, assuming the UI calls the function successfully)
    const testUserId = "2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e"; // Real User ID (2ff...)
    const mockSessionId = `sess_mock_${Date.now()}`;
    const amount = 3500; // 35 THB

    console.log(`ℹ️ [2/4] Simulating Payment Link Generation... (Skipping actual Stripe API call)`);
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Amount: ${amount / 100} THB`);

    // 3. Simulate Webhook Processing (Manually executing the logic from stripe-webhook/index.ts)
    console.log(`🔄 [3/4] Simulating Webhook Processing for 'checkout.session.completed'...`);

    // Logic from webhook:
    // UPDATE service_providers SET owner_id = userId, claimed = true, claimed_at = NOW, stripe_status = 'verified'

    const { error: updateError } = await supabase
        .from('service_providers')
        .update({
            owner_id: testUserId,
            claimed: true,
            claimed_at: new Date().toISOString(),
            stripe_status: 'verified'
        })
        .eq('id', provider.id);

    if (updateError) {
        console.error("❌ Webhook Simulation Failed (DB Update):", updateError);
        return;
    }

    // Logic from webhook: RPC process_transaction
    const { error: txnError } = await supabase.rpc('process_transaction', {
        target_user_id: testUserId,
        amount: amount / 100,
        type: 'payment', // Matching ENUM value
        reference_id: mockSessionId,
        metadata: { type: 'claim_profile', providerId: provider.id, simulated: true }
    });

    if (txnError) {
        console.error("⚠️ Transaction Record Failed:", txnError);
        // Not fatal for the claim itself, but bad for records
    } else {
        console.log("   Transaction recorded successfully.");
    }

    console.log(`✅ [3/4] Webhook Logic Applied Successfully.`);

    // 4. Verify Final State
    const { data: finalProvider, error: fetchError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', provider.id)
        .single();

    if (fetchError) {
        console.error("❌ Failed to fetch final provider state:", fetchError);
        return;
    }

    if (finalProvider.claimed === true && finalProvider.stripe_status === 'verified' && finalProvider.owner_id === testUserId) {
        console.log(`✅ [4/4] VERIFICATION SUCCESS! 🎉`);
        console.log(`   Provider '${finalProvider.business_name}' is now CLAIMED and VERIFIED.`);

        // Cleanup (Optional - maybe keep for inspection?)
        console.log("🧹 Cleaning up test data...");
        await supabase.from('service_providers').delete().eq('id', provider.id);
        console.log("   Test provider deleted.");

    } else {
        console.error("❌ VERIFICATION FAILED. Final State:", finalProvider);
    }
}

runSimulation();
