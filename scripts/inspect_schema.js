
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRow() {
    console.log("🔍 Fetching one record to inspect schema...");

    const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    console.log("Keys found:", Object.keys(data[0]));
    console.log("Sample Data:", JSON.stringify(data[0], null, 2));
}

inspectRow();
