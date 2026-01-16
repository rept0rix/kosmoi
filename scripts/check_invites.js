
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    console.log("Recent Invitations:");
    console.table(data);
}

check();
