
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('service_providers')
        .select('business_name, category, sub_category')
        .ilike('business_name', '%WAT%')
        .limit(5);
    console.log(data);
}
check();
