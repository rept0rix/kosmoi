import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Project:", supabaseUrl.split('.')[0].split('//')[1]); // Log Project Ref
    // Try to select owner_id
    const { data, error } = await supabase
        .from('service_providers')
        .select('owner_id')
        .limit(1);

    if (error) {
        if (error.code === '42703') { // Undefined column
            console.log("MISSING: owner_id column does not exist.");
        } else {
            console.error("ERROR:", error.message);
        }
    } else {
        console.log("EXISTS: owner_id column exists.");
    }
}

check();
