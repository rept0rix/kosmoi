import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role for admin actions

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🏦 Testing P2P System...");

    // 1. Get or Create 2 Users (we'll just use dummy UUIDs for testing if auth.users FK constraint allows, 
    // BUT the migration had REFERENCES auth.users(id). So we need real users.
    // We will pick 2 existing users from service_providers owner_ids or just create wallets for known IDs if possible.
    // Let's list 2 users from service_providers.

    // 1. Get Users
    let userA, userB;

    // Try service_providers first
    const { data: spUsers, error: spError } = await supabase
        .from('service_providers')
        .select('owner_id')
        .limit(2);

    if (spError) console.error("SP Fetch Error:", spError);

    const candidates = spUsers?.map(s => s.owner_id).filter(id => id) || [];

    if (candidates.length >= 2) {
        userA = candidates[0];
        userB = candidates[1];
    } else {
        console.log("Not enough service_providers, trying auth.admin.listUsers...");
        // Fallback to auth users (requires service role)
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error("Auth Admin Error:", authError);
        } else if (authUsers?.users?.length >= 2) {
            userA = authUsers.users[0].id;
            userB = authUsers.users[1].id;
        } else {
            console.log("Not enough auth users. Creating test users...");
            // Create test users
            const { data: u1, error: e1 } = await supabase.auth.admin.createUser({ email: `test_p2p_${Date.now()}_a@example.com`, password: 'password123', email_confirm: true });
            const { data: u2, error: e2 } = await supabase.auth.admin.createUser({ email: `test_p2p_${Date.now()}_b@example.com`, password: 'password123', email_confirm: true });

            if (e1 || e2) {
                console.error("Failed to create test users:", e1, e2);
                process.exit(1);
            }
            userA = u1.user.id;
            userB = u2.user.id;
        }
    }

    if (!userA || !userB) {
        console.error("Could not obtain 2 users for testing.");
        process.exit(1);
    }

    console.log(`User A: ${userA}`);
    console.log(`User B: ${userB}`);

    // 2. Create Wallets
    // We'll upsert via SQL or just insert and ignore conflict
    // Since we are using service role, we can do direct insert
    console.log("Creating Wallets...");
    await supabase.from('wallets').upsert({ user_id: userA, balance: 1000 }, { onConflict: 'user_id' }).select();
    await supabase.from('wallets').upsert({ user_id: userB, balance: 0 }, { onConflict: 'user_id' }).select();

    // 3. Check Initial Balance
    const { data: wA } = await supabase.from('wallets').select('balance').eq('user_id', userA).single();
    const { data: wB } = await supabase.from('wallets').select('balance').eq('user_id', userB).single();
    console.log(`Initial Balances -> A: ${wA.balance}, B: ${wB.balance}`);

    // 4. Transfer 100 from A to B
    console.log("💸 Transferring 100...");
    const { data: tx, error: txError } = await supabase.rpc('transfer_funds', {
        sender_id: userA,
        recipient_id: userB,
        amount: 100,
        description: 'Test Transfer'
    });

    if (txError) {
        console.error("Transfer Failed:", txError);
    } else {
        console.log("Transfer Result:", tx);
    }

    // 5. Verify Final Balance
    const { data: wA2 } = await supabase.from('wallets').select('balance').eq('user_id', userA).single();
    const { data: wB2 } = await supabase.from('wallets').select('balance').eq('user_id', userB).single();
    console.log(`Final Balances   -> A: ${wA2.balance}, B: ${wB2.balance}`);

    if (wA2.balance == wA.balance - 100 && wB2.balance == wB.balance + 100) {
        console.log("✅ P2P Logic Verified!");
    } else {
        console.error("❌ Balance mismatch!");
    }
}

run();
