
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log(`Testing connection to: ${supabaseUrl}`);

    try {
        const { data, error } = await supabase.from('board_meetings').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Supabase Connection Failed:", error.message);
            console.error("Error Details:", error);
        } else {
            console.log("✅ Supabase Connection Successful!");
            console.log("Table 'board_meetings' is accessible.");
        }
    } catch (err) {
        console.error("❌ Unexpected Error:", err.message);
    }
}

checkConnection();
