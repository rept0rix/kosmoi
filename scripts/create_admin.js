import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    const email = 'admin@kosmoi.com';
    const password = 'password123';

    console.log(`Creating admin user: ${email}...`);

    // Check if exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    let userId;
    const existing = users?.users?.find(u => u.email === email);

    if (existing) {
        console.log('✅ User already exists. Updating password...');
        userId = existing.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true,
            user_metadata: { role: 'admin', display_name: 'Admin User' }
        });
        if (updateError) console.error('Error updating:', updateError);
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin', display_name: 'Admin User' }
        });

        if (error) {
            console.error('❌ Failed to create user:', error.message);
            return;
        }
        userId = data.user.id;
        console.log(`✅ User created! ID: ${userId}`);
    }

    // Assign Role in public.users / profiles if needed
    // Assuming 'profiles' or 'users' table syncs via triggers, OR we need to manually insert role

    // Check 'profiles' table existence and update role
    // This depends on the app's specific RBAC implementation.
    // Based on previous context, roles might be in user_metadata or a separate table.
    // Trying to upsert to 'profiles' just in case.

    try {
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: userId,
            email: email,
            role: 'admin',
            full_name: 'System Admin'
        });

        if (profileError) {
            console.warn('⚠️ Could not update profiles table (might not exist or different schema):', profileError.message);
        } else {
            console.log('✅ Profiles table updated.');
        }
    } catch (e) {
        console.warn('⚠️ Profile update skipped.');
    }

    console.log('\n🎉 Admin Ready!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

createAdmin();
