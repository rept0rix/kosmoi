
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    const { count, error } = await supabase.from('crm_leads').select('*', { count: 'exact', head: true });
    if (error) console.error(error);
    console.log(`CRM Leads Count: ${count}`);

    // Check interactions
    const { count: iCount } = await supabase.from('crm_interactions').select('*', { count: 'exact', head: true });
    console.log(`CRM Interactions Count: ${iCount}`);
}

verify();
