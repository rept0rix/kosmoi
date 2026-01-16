
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

async function promoteGoogleUser() {
    console.log("🛠️  Promoting Google User to Admin...");

    const email = 'na0ryank0@gmail.com'; // The user's Google email

    // 1. Find user in Auth (might not exist if they haven't successfully logged in yet via Google)
    // But usually Supabase auto-creates it on first OAuth login.
    // We can list users to find them.
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("❌ Failed to list users:", listError);
        process.exit(1);
    }

    const googleUser = users.find(u => u.email === email);

    if (!googleUser) {
        console.log(`⚠️ User ${email} not found in Auth. They need to sign in with Google at least once first (even if it failed previously, the user record might be created).`);
        console.log("   However, we can preemptively try to ensure the public profile exists if we knew the ID.");
        console.log("   For now, we will wait for them to log in.");
        return;
    }

    console.log(`✅ Found Auth User: ${googleUser.id}`);

    // 2. Ensure Role is Admin in public.users
    const { data: userRecord, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', googleUser.id)
        .single();

    if (!userRecord) {
        console.log("   Creating public user record...");
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: googleUser.id,
                role: 'admin',
                email: email,
                full_name: googleUser.user_metadata.full_name || 'Naor Yanko'
            });

        if (insertError) {
            console.error("❌ Failed to insert user record:", insertError);
        } else {
            console.log("✅ Inserted public user record with role 'admin'.");
        }
    } else {
        if (userRecord.role !== 'admin') {
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', googleUser.id);

            if (updateError) {
                console.error("❌ Failed to update role:", updateError);
            } else {
                console.log("✅ Updated user role to 'admin'.");
            }
        } else {
            console.log("✅ User already has 'admin' user role.");
        }
    }

    // 3. Ensure Wallet
    const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', googleUser.id).single();
    if (!wallet) {
        await supabase.from('wallets').insert({
            user_id: googleUser.id,
            balance: 100000,
            currency: 'THB',
            vibes_balance: 50000
        });
        console.log("✅ Created admin wallet for Google user.");
    }
}

promoteGoogleUser();
