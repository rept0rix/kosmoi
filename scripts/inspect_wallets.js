
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    const { data, error } = await supabase.from('wallets').select('*').limit(1);
    if (error) console.error(error);
    else if (data && data.length > 0) console.log("Columns:", Object.keys(data[0]));
    else console.log("No data found to inspect columns.");
}
inspect();
