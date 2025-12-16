
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log("Testing connection to:", url);
    const { data, error } = await supabase.from('agents').select('id, role');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Agents:", data);
    }
}

test();

