
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Check Public Table (Service Providers)
        const { count, data, error } = await supabase.from('service_providers').select('*', { count: 'exact', head: false }).limit(1);

        if (error) {
            console.error('Service Providers Error:', error);
        } else {
            console.log('Service Providers Public Access:', { count, sample: data && data.length > 0 ? data[0].business_name : 'No Data' });
        }

        // Check Leads Table (Likely Protected)
        const { count: leadCount, data: leads, error: leadsError } = await supabase.from('leads').select('*', { count: 'exact' }).limit(1);
        if (leadsError) {
            console.error('Leads Table Error (Expected if RLS blocks):', leadsError);
        } else {
            console.log('Leads Table Access:', { count: leadCount, sample: leads });
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

testConnection();
