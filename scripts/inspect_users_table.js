
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectUsersTable() {
    console.log(`Inspecting users table (public)...`);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log("Users table sample:", data);
}

inspectUsersTable();
