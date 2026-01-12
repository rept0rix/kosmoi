
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVibeAward() {
    console.log("💎 Testing Vibe Award RPC...");

    // 1. Find User (Alice)
    const { data: usersData, error: uErr } = await supabaseAdmin.auth.admin.listUsers();
    const alice = usersData.users.find(u => u.email === 'alice@kosmoi.test');

    if (!alice) {
        console.error("❌ Alice not found. Run seed_stable_users.js first.");
        return;
    }

    console.log(`👤 Found Alice: ${alice.id}`);

    // Get initial balance
    const { data: walletBefore } = await supabaseAdmin.from('wallets').select('vibes_balance').eq('user_id', alice.id).single();
    console.log(`💰 Previous Balance: ${walletBefore.vibes_balance}`);

    // 2. Award Vibes
    const { data, error } = await supabaseAdmin.rpc('award_vibes', {
        target_user_id: alice.id,
        amount: 100,
        reason: 'Test Script Reward',
        source: 'manual_test'
    });

    if (error) {
        console.error("❌ RPC Failed:", error);
    } else {
        console.log("✅ RPC Success:", data);
    }

    // 3. Verify
    const { data: walletAfter } = await supabaseAdmin.from('wallets').select('vibes_balance').eq('user_id', alice.id).single();
    console.log(`💰 New Balance: ${walletAfter.vibes_balance} (Expected +100)`);
}

testVibeAward();
