import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEarnings() {
    console.log('--- Verifying Earnings Logic ---');

    // 1. Get a provider with an owner_id
    const { data: provider } = await supabase
        .from('service_providers')
        .select('id, owner_id')
        .not('owner_id', 'is', null)
        .limit(1)
        .single();

    if (!provider) {
        console.error('No provider with owner_id found to test with.');
        return;
    }
    console.log(`Testing with Provider ID: ${provider.id}, Owner ID: ${provider.owner_id}`);

    // 2. Get or Create Wallet
    let { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', provider.owner_id)
        .single();

    let walletCreated = false;
    if (!wallet) {
        console.log('No wallet found. Creating one...');
        const { data: newWallet, error: walletError } = await supabase
            .from('wallets')
            .insert({ user_id: provider.owner_id, balance: 0 })
            .select()
            .single();

        if (walletError) {
            console.error('Failed to create wallet:', walletError);
            return;
        }
        wallet = newWallet;
        walletCreated = true;
        console.log(`Created Wallet: ${wallet.id}`);
    } else {
        console.log(`Using Existing Wallet: ${wallet.id}`);
    }

    // 3. Insert dummy transaction
    const testAmount = 555;
    const { data: txn, error: insertError } = await supabase
        .from('transactions')
        .insert({
            wallet_id: wallet.id,
            amount: testAmount,
            type: 'earning',
            status: 'completed',
            description: 'Test Verification Earning',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (insertError) {
        console.error('Insert Transaction Failed:', insertError);
        // Try cleanup if we created wallet
        if (walletCreated) await supabase.from('wallets').delete().eq('id', wallet.id);
        return;
    }
    console.log(`Inserted Transaction: ${txn.id} for ฿${testAmount}`);

    // 4. Simulate Dashboard Fetch (The Verification)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: earningsData, error: fetchError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('wallet_id', wallet.id) // Use Wallet ID
        .eq('type', 'earning')
        .eq('status', 'completed')
        .gte('created_at', today.toISOString());

    if (fetchError) {
        console.error('Fetch Failed:', fetchError);
    } else {
        const total = earningsData.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        console.log(`Fetched Total Earnings: ฿${total}`);

        if (total >= testAmount) {
            console.log('✅ SUCCESS: Earnings logic works!');
        } else {
            console.error('❌ FAILURE: Total mismatch.');
        }
    }

    // 5. Cleanup
    await supabase.from('transactions').delete().eq('id', txn.id);
    if (walletCreated) {
        await supabase.from('wallets').delete().eq('id', wallet.id);
        console.log('Deleted temporary wallet.');
    }
    console.log('Cleanup complete.');
}

verifyEarnings();
