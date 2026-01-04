
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function check() {
    console.log('--- Checking with Service Role (Bypassing RLS) ---');
    const { data, error, count } = await supabase
        .from('service_providers')
        .select('id, business_name, status', { count: 'exact' })
        .limit(5);

    if (error) {
        console.error('Service Role Error:', error);
    } else {
        console.log(`Total Count: ${count}`);
        console.log('Sample Data:', data);
    }
}

check();
