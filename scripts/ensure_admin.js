
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

async function ensureAdmin() {
    console.log("🛠️  Ensuring Admin User Exists...");

    const email = 'admin@kosmoi.site';
    const password = 'Password123!';
    let userId;

    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("❌ Failed to list users:", listError);
        process.exit(1);
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`✅ User ${email} already exists.`);
        userId = existingUser.id;

        // Update password just in case
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: password });
        if (updateError) {
            console.error("❌ Failed to update password:", updateError);
        } else {
            console.log("   Updated password.");
        }
    } else {
        console.log(`🔸 Creating user ${email}...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: 'Admin User' }
        });

        if (createError) {
            console.error("❌ Failed to create user:", createError);
            process.exit(1);
        }
        userId = newUser.user.id;
        console.log("   Created user.");
    }

    // 2. Ensure Role is Admin in public.users
    console.log(`Checking role for user ${userId}...`);

    // Check if record exists
    const { data: userRecord, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("❌ Error fetching user record:", fetchError);
    }

    if (!userRecord) {
        const { error: insertError } = await supabase
            .from('users')
            .insert({ id: userId, role: 'admin', email: email, full_name: 'Admin User' });

        if (insertError) {
            console.error("❌ Failed to insert user record:", insertError);
        } else {
            console.log("✅ Inserted user record with role 'admin'.");
        }
    } else {
        if (userRecord.role !== 'admin') {
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', userId);

            if (updateError) {
                console.error("❌ Failed to update role:", updateError);
            } else {
                console.log("✅ Updated user role to 'admin'.");
            }
        } else {
            console.log("✅ User already has 'admin' role.");
        }
    }

    // 3. Ensure Wallet exists (optional but good for testing)
    const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', userId).single();
    if (!wallet) {
        console.log("Creating wallet for admin...");
        await supabase.from('wallets').insert({
            user_id: userId,
            balance: 100000,
            currency: 'THB',
            vibes_balance: 50000
        });
        console.log("✅ Created admin wallet.");
    }
}

ensureAdmin();
