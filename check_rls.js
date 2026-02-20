
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the project root
const envPath = join(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log("Checking RLS...");

async function check() {
    // 1. Check with Anon Key
    console.log("\n--- Checking with Anon Key ---");
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await anonClient
        .from('service_providers')
        .select('count', { count: 'exact' })
        .eq('status', 'active');

    if (anonError) {
        console.error("Anon Error:", anonError.message);
    } else {
        console.log("Anon Count:", anonData.length > 0 ? anonData[0] : 0); // select count returns array
        console.log("Anon Data (first 1):", anonData);
    }

    // 2. Check with Service Role Key (if available)
    if (supabaseServiceKey) {
        console.log("\n--- Checking with Service Role Key ---");
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: adminData, error: adminError } = await adminClient
            .from('service_providers')
            .select('count', { count: 'exact' })
            .eq('status', 'active');

        if (adminError) {
            console.error("Admin Error:", adminError.message);
        } else {
            console.log("Admin Count:", adminData.length > 0 ? adminData[0] : 0);
            console.log("Admin Data (first 1):", adminData);
        }
    } else {
        console.log("\n--- Skipping Service Role Check (Key not found) ---");
        console.log("Please provide SUPABASE_SERVICE_ROLE_KEY in .env to verify admin access.");
    }
}

check();
