
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
    console.log(`Connecting to ${supabaseUrl}...`);

    // Check service_providers
    const { count, error } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error connecting or table missing:", error.message);
        if (error.code === '42P01') { // undefined_table
            console.log("STATUS: MISSING_SCHEMA");
        } else {
            console.log("STATUS: CONNECTION_ERROR");
        }
    } else {
        console.log(`Connection successful. Found ${count} service providers.`);
        if (count === 0) {
            console.log("STATUS: EMPTY_DB");
        } else {
            console.log("STATUS: ACTIVE_DB");
        }
    }
}

checkDB();
