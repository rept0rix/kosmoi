import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("❌ No SUPABASE_SERVICE_ROLE_KEY found in .env (checked VITE_ prefix too)");
    console.log("Available Keys:", Object.keys(process.env).filter(k => k.startsWith('SUPABASE') || k.startsWith('VITE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatest() {
    console.log("🔍 Checking latest messages...");

    const { data, error } = await supabase
        .from('board_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkLatest();
