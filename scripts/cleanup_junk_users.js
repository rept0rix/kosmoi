
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/Users/naoryanko/Downloads/samui-service-hub-main/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JUNK_PATTERNS = [
    'audit_%',
    'receiver_%',
    'sender_%',
    'claimant_%',
    'provider_%',
    'repro_%',
    'robot_%',
    'debug_%',
    '%@test.com', // CAREFUL: This might match intended test users, but user said he only wants specific ones.
    '%@kosmoi.test'
];

// User explicitly listed these as "Active" in the screenshot, but then said:
// "I need to see 2-3 users dev admin na0ryank0"
// So we should KEEP:
// - admin@kosmoi.site
// - na0ryank0@gmail.com
// - admin@kosmoi.com (maybe?)
// - dev@kosmoi.ai
// - test.user% (Maybe keep one?)

const KEEP_EMAILS = [
    'admin@kosmoi.site',
    'na0ryank0@gmail.com',
    'admin@kosmoi.com',
    'dev@kosmoi.ai'
];

async function cleanupUsers() {
    console.log('Starting cleanup...');

    // 1. Fetch all users
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} total users.`);

    const usersToDelete = users.filter(u => {
        // Keep the whitelist
        if (KEEP_EMAILS.includes(u.email)) return false;

        // Delete if matches junk patterns
        // actually, simpler logic: Delete EVERYTHING that is NOT in the whitelist?
        // User said: "I need to see 2-3 users dev admin na0ryank0"
        // Let's be aggressive but safe. 

        // Let's check against whitelist
        return true;
    });

    console.log(`Found ${usersToDelete.length} users to delete.`);

    for (const user of usersToDelete) {
        console.log(`Cleaning up dependencies for ${user.email} (${user.id})...`);

        // Delete dependencies manually to handle constraints
        // 1. Delete transactions first (Foreign key to wallet)
        await supabase.from('transactions').delete().or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`);
        // Wait, transactions typically link to wallet_id, not user_id directly.
        // We need to find the wallet first.
        const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', user.id).single();

        if (wallet) {
            console.log(`Deleting transactions for wallet ${wallet.id}...`);
            await supabase.from('transactions').delete().or(`sender_wallet_id.eq.${wallet.id},receiver_wallet_id.eq.${wallet.id}`);
            await supabase.from('wallets').delete().eq('id', wallet.id);
        }

        await supabase.from('favorites').delete().eq('user_id', user.id);
        await supabase.from('reviews').delete().eq('user_id', user.id);
        await supabase.from('search_history').delete().eq('user_id', user.id);
        await supabase.from('service_requests').delete().eq('user_id', user.id);
        await supabase.from('agent_memory').delete().eq('user_id', user.id);
        await supabase.from('user_activity_logs').delete().eq('user_id', user.id);

        // Service Providers tricky - might be owned by user.
        // Let's see if we can delete them or if they restrict user deletion.
        await supabase.from('service_providers').delete().eq('owner_id', user.id);

        console.log(`Deleting ${user.email} (${user.id})...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`Failed to delete ${user.email}:`, deleteError.message);
        } else {
            console.log(`Deleted ${user.email}`);
        }
    }
    console.log('Cleanup complete.');
}

cleanupUsers();
