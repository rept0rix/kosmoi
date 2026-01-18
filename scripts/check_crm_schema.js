
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("🔍 Checking crm_leads schema...");

    // We can't query information_schema easily with js client without elevated RLS or helper fns.
    // simpler to just try a select and see what keys return, or inspect error

    const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting:", error.message);
    } else {
        console.log("Columns found (from sample):", data.length > 0 ? Object.keys(data[0]) : "Table empty or no columns visible");
    }
}

checkSchema();
