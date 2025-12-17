
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const TASK_ID = 'd166dbf8-1085-4fd8-b079-c20f8d4b6e4b'; // ID from previous step

async function check() {
    const { data } = await supabase.from('agent_tasks').select('result').eq('id', TASK_ID).single();
    console.log("Full Result:", data.result);
}
check();
