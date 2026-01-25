
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Config");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyAdminModules() {
    console.log("🔍 Starting Admin Dashboard Verification...\n");

    // 1. Users (AdminUsers.jsx)
    console.log("1️⃣  Verifying Users Logic:");
    const { data: users, error: userError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (userError) console.error("   ❌ Failed to Access Users Table:", userError.message);
    else console.log(`   ✅ Users Table Accessible (Count: ${users === null ? 'N/A (Head)' : users})`);

    // Check if 'fix_users_table' needed (42P01)
    if (userError && userError.code === '42P01') console.log("   ⚠️  Result: Users table missing (Known Issue)");


    // 2. Claims (AdminClaims.jsx)
    console.log("\n2️⃣  Verifying Business Claims:");
    const { data: claims, error: claimError } = await supabase.from('business_claims').select('*').limit(1);
    if (claimError) console.error("   ❌ Claims Table Error:", claimError.message);
    else console.log(`   ✅ Claims Accessible. Sample: ${claims.length} found.`);

    // 3. Bookings (AdminBookings.jsx)
    console.log("\n3️⃣  Verifying Bookings:");
    const { data: bookings, error: bookingError } = await supabase.from('bookings').select('*').limit(1);
    if (bookingError) console.error("   ❌ Bookings Table Error:", bookingError.message);
    else console.log(`   ✅ Bookings Table Accessible. Sample: ${bookings.length} found.`);

    // 4. Wallet (AdminWallet.jsx + WalletService.ts)
    console.log("\n4️⃣  Verifying Wallet System:");
    const { data: wallets, error: walletError } = await supabase.from('wallets').select('*').limit(1);
    if (walletError) console.error("   ❌ Wallet Table Error:", walletError.message);
    else console.log(`   ✅ Wallet Table Accessible. Sample: ${wallets.length} found.`);

    // 5. Agents (AdminAgents.jsx)
    console.log("\n5️⃣  Verifying Agent Configs:");
    // AdminAgents typically uses local storage, but registry uses 'agent_configs' (maybe custom table?)
    // AgentRegistry.js refers to db.entities.AgentConfigs. Let's see if a table matches.
    const { data: agentConfigs, error: agentError } = await supabase.from('agent_configs').select('*').limit(1);
    if (agentError) {
        console.error("   ❌ Agent Configs Table Error:", agentError.message);
        console.log("   ℹ️  Note: AdminAgents.jsx relies on LocalStorage primarily, which is why it feels 'fake'.");
    } else {
        console.log(`   ✅ Agent Configs Accessible. Sample: ${agentConfigs.length} found.`);
    }

    // 6. Marketplace (Marketplace.jsx)
    console.log("\n6️⃣  Verifying Marketplace Items:");
    const { data: items, error: marketError } = await supabase.from('marketplace_items').select('*').limit(1);
    if (marketError) {
        console.error("   ❌ Marketplace Items Table Error:", marketError.message);
        console.log("   ℹ️  Note: Marketplace.jsx falls back to MOCK_PRODUCTS.");
    } else {
        console.log(`   ✅ Marketplace Items Accessible. Sample: ${items.length} found.`);
    }

}

verifyAdminModules();
