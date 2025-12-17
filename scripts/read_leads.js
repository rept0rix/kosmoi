
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function listLeads() {
    const { data } = await supabase.from('crm_leads').select('*');
    console.log(JSON.stringify(data, null, 2));
}

listLeads();
