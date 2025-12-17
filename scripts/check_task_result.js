
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const id = process.argv[2];

async function check() {
    const { data } = await supabase.from('agent_tasks').select('result').eq('id', id).single();
    console.log("Result:", data.result);
}
check();
