
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USERS = [
    { email: 'alice@kosmoi.test', password: 'password123', name: 'Alice (Test)' },
    { email: 'bob@kosmoi.test', password: 'password123', name: 'Bob (Test)' }
];

async function seedUsers() {
    console.log("🌱 Seeding Stable Users...");

    for (const u of USERS) {
        // 1. Check if exists
        // Admin API to list users is pagination based, but we can try to createUser and catch error, 
        // or just rely on 'signIn' failing/succeeding? 
        // Best is listUsers with filter if possible, or attempt creation.

        console.log(`Checking ${u.email}...`);

        let userId;

        // Try to create
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.name }
        });

        if (createError) {
            if (createError.message.includes('already has been registered')) {
                console.log(`   -> User exists.`);
                // Need to find ID. Unfortunately, admin.listUsers() is the way.
                const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                const existing = listData.users.find(x => x.email === u.email);
                if (existing) userId = existing.id;
            } else {
                console.error(`   ❌ Error creating ${u.email}:`, createError.message);
                continue;
            }
        } else {
            console.log(`   ✅ Created new user.`);
            userId = createData.user.id;
        }

        if (!userId) {
            console.error("   ❌ Could not resolve User ID.");
            continue;
        }

        // 2. Ensure Wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (walletError && walletError.code === 'PGRST116') {
            // Create
            const { error: insertError } = await supabaseAdmin
                .from('wallets')
                .insert({
                    user_id: userId,
                    balance: 5000,
                    // vibes_balance: 100 // Uncomment if column exists
                });
            if (insertError) console.error("   ❌ Wallet create failed:", insertError);
            else console.log("   💰 Created Wallet with 5000 THB");
        } else if (wallet) {
            console.log(`   💰 Wallet exists (Balance: ${wallet.balance})`);
            // Topup if low
            if (wallet.balance < 1000) {
                await supabaseAdmin.from('wallets').update({ balance: 5000 }).eq('id', wallet.id);
                console.log("   💵 Topped up to 5000 THB");
            }
        }
    }
    console.log("✅ Seed Complete.");
}

seedUsers();
