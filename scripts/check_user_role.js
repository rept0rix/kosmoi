
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
    const email = 'na0ryank0@gmail.com';
    console.log(`Checking role for: ${email}`);

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .ilike('email', email);

    if (error) {
        console.error("Error fetching profile:", error);
        return;
    }

    console.log("Found profiles:", profiles);
}

checkUserRole();
