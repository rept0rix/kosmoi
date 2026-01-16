
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedTransactions() {
    console.log("🛠️ Starting Transaction Seeding...");

    // 1. Get Users to act as senders/receivers
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError || !users.users.length) {
        console.error("❌ Failed to fetch users or no users found.");
        return;
    }

    const validUsers = users.users.slice(0, 5); // Use first 5 users
    console.log(`✅ Found ${validUsers.length} users to use for transactions.`);

    // 2. Ensure Wallets exist for these users
    const wallets = [];
    for (const user of validUsers) {
        let { data: wallet } = await supabase
            .from('wallets')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!wallet) {
            console.log(`   🔸 Creating wallet for ${user.email}...`);
            const { data: newWallet, error: wError } = await supabase
                .from('wallets')
                .insert({
                    user_id: user.id,
                    balance: 10000,
                    currency: 'THB',
                    vibes_balance: 5000
                })
                .select()
                .single();

            if (wError) {
                console.error(`   ❌ Failed to create wallet: ${wError.message}`);
                continue;
            }
            wallet = newWallet;
        }
        wallets.push(wallet);
    }

    if (wallets.length < 2) {
        console.warn("⚠️ Not enough wallets to create transfers. Need at least 2.");
    }

    // 3. Create Transactions
    const transactions = [];
    const types = ['transfer', 'deposit', 'withdrawal'];
    const currencies = ['THB', 'VIBES'];

    for (let i = 0; i < 20; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const amount = Math.floor(Math.random() * 5000) + 100;

        let fromWallet = null;
        let toWallet = null;
        let description = "";

        if (type === 'transfer' && wallets.length >= 2) {
            const senderIdx = Math.floor(Math.random() * wallets.length);
            let receiverIdx = Math.floor(Math.random() * wallets.length);
            while (receiverIdx === senderIdx) {
                receiverIdx = Math.floor(Math.random() * wallets.length);
            }
            fromWallet = wallets[senderIdx].id;
            toWallet = wallets[receiverIdx].id;
            description = `Transfer from ${validUsers[senderIdx].email}`;
        } else if (type === 'deposit') {
            toWallet = wallets[Math.floor(Math.random() * wallets.length)].id;
            description = "Top-up via Bank Transfer";
        } else if (type === 'withdrawal') {
            fromWallet = wallets[Math.floor(Math.random() * wallets.length)].id;
            description = "Withdrawal to Bank Account";
        } else {
            // Purchase
            fromWallet = wallets[Math.floor(Math.random() * wallets.length)].id;
            description = "Payment for Service #123";
        }

        // Determine primary owner (wallet_id)
        let walletId = fromWallet;
        if (type === 'deposit') {
            walletId = toWallet;
        }

        transactions.push({
            wallet_id: walletId,
            type,
            amount,
            currency,
            status: 'completed',
            from_wallet_id: fromWallet,
            to_wallet_id: toWallet,
            description,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(), // Random past date
            metadata: {
                source: 'seed_script',
                reference_id: `REF-${Math.floor(Math.random() * 10000)}`
            }
        });
    }

    // 4. Insert Metadata
    const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactions);

    if (insertError) {
        console.error(`❌ Failed to insert transactions: ${insertError.message}`);
    } else {
        console.log(`✅ Successfully inserted ${transactions.length} transactions.`);
    }
}

seedTransactions();
