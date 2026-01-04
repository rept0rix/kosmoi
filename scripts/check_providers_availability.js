
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Debugging Connection ---');
console.log('URL:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'UNDEFINED');
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'UNDEFINED');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProviders() {
    console.log('\nQuerying service_providers...');

    try {
        const { count, error, data } = await supabase
            .from('service_providers')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase Error:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log(`Total providers count: ${count}`);

        const { data: active, error: activeError } = await supabase
            .from('service_providers')
            .select('id, business_name, status')
            .eq('status', 'active')
            .limit(3);

        if (activeError) throw activeError;

        if (!active || active.length === 0) {
            console.log('No ACTIVE providers found.');
        } else {
            console.log('Found active providers:', active);
        }

    } catch (error) {
        console.error('Full Error Object:', error);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

checkProviders();
