
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing Supabase insert...");
    const { data, error } = await supabase.from('board_meetings').insert([{ title: "Kosmoi Launch", status: 'active' }]).select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert successful:", data);
    }
}

testInsert();
