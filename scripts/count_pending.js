
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countPending() {
    const { count, error } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .is('latitude', null)
        .neq('status', 'review_needed');

    if (error) console.error(error);
    else console.log(`Pending Enrichment: ${count}`);
}

countPending();
