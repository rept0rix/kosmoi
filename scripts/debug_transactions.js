import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Using service role key to bypass RLS for verification
// AdminService usually runs with user auth, but for global fetching checking RLS is important.
// Let's try anon first, but if RLS prevents it, we might need to sign in or use service role if available (usually not in .env for client apps).
// Actually, AdminService.getAllTransactions likely relies on the user being an admin.
// If I use anon key without auth, I might get 0 results due to RLS.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
    console.log('Checking transactions...');

    // 1. Try public fetch (might fail if RLS is on)
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching transactions:', error);
    } else {
        console.log(`Found ${data.length} transactions (limit 5).`);
        if (data.length > 0) {
            console.log('Sample transaction:', data[0]);
        } else {
            console.log('No transactions found. This might be empty DB or RLS.');
        }
    }

    console.log('--- Control Test ---');
    const { data: spData, error: spError } = await supabase
        .from('service_providers')
        .select('id')
        .limit(1);

    if (spError) {
        console.error('Control test failed (service_providers):', spError);
    } else {
        console.log(`Control test passed. Found ${spData.length} service_providers.`);
    }
}

checkTransactions();
