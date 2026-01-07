import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

// Use Service Role for setup (creating business/invitation), 
// but use a REAL USER token for the actual claim to simulate RLS correctly.
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTest() {
    console.log("🧪 Testing Claim Profile Flow...");

    // 1. Create a Test User (The Claimant)
    const email = `claimant_${Date.now()}@test.com`;
    const password = 'password123';
    console.log(`👤 Creating test user: ${email}`);

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (userError) {
        console.error("❌ Failed to create user:", userError);
        process.exit(1);
    }
    const userId = userData.user.id;
    console.log(`✅ User created: ${userId}`);

    // 2. Create a Test Business (The Prize)
    console.log("🏢 Creating test business...");
    const { data: business, error: busError } = await supabaseAdmin
        .from('service_providers')
        .insert({
            business_name: `Test Business ${Date.now()}`,
            category: 'restaurants',
            status: 'pending', // Unclaimed
            owner_id: null // Explicitly null
        })
        .select()
        .single();

    if (busError) {
        console.error("❌ Failed to create business:", busError);
        process.exit(1);
    }
    const businessId = business.id;
    console.log(`✅ Business created: ${business.business_name} (${businessId})`);

    // 3. Create Invitation Token
    console.log("💌 Creating invitation token...");
    const token = nanoid(32);
    const { error: inviteError } = await supabaseAdmin
        .from('invitations')
        .insert({
            service_provider_id: businessId,
            token: token,
            status: 'pending',
            expires_at: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        });

    if (inviteError) {
        console.error("❌ Failed to create invitation:", inviteError);
        process.exit(1);
    }
    console.log(`✅ Invitation created. Token: ${token}`);

    // 4. Simulate Client-Side Claim (Using User Context)
    console.log("🔄 Simulating User Claim (RPC Call)...");

    // Login as the user to get a session
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error("❌ Login failed:", loginError);
        process.exit(1);
    }

    // Create a client AS THE USER
    const supabaseUser = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${loginData.session.access_token}`
                }
            }
        }
    );

    // Call the RPC
    const { data: claimResult, error: claimError } = await supabaseUser.rpc('claim_business', {
        token_input: token
    });

    if (claimError) {
        console.error("❌ Claim RPC Failed:", claimError);
    } else {
        console.log("RPC Result:", claimResult);

        if (claimResult.success) {
            console.log("✅ Claim Successful according to RPC!");

            // 5. Verify the Database State
            console.log("🔎 Verifying DB State...");
            const { data: updatedBusiness } = await supabaseAdmin
                .from('service_providers')
                .select('owner_id, status')
                .eq('id', businessId)
                .single();

            if (updatedBusiness.owner_id === userId && updatedBusiness.status === 'verified') {
                console.log("🎉 SUCCESS: Business owner_id matches User ID and status is verified!");
            } else {
                console.error("❌ FAILURE: DB state mismatch.", updatedBusiness);
            }

        } else {
            console.error("❌ RPC returned failure:", claimResult.error);
        }
    }
}

runTest();
