
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdminRole() {
    const email = 'na0ryank0@gmail.com';
    console.log(`Searching for user: ${email}...`);

    // 1. Find User by Email in Auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User not found in Auth system!");
        // Debug: list all emails
        console.log("Users in Auth:", users.map(u => u.email));
        return;
    }

    console.log(`Found User ID: ${user.id}`);

    // 2. Upsert User with Admin Role in public.users
    const { data, error: tableError } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            email: email, // Assuming email is also stored here based on inspection
            role: 'admin',
            updated_at: new Date().toISOString()
        })
        .select();

    if (tableError) {
        console.error("Error updating public.users:", tableError);
    } else {
        console.log("✅ Success! Updated public.users to ADMIN:", data);
    }
}

setAdminRole();
