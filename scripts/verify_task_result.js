
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTaskResult() {
    console.log("Fetching last task result...");
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('title', 'List Files Task')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("Error fetching task:", error);
    } else {
        console.log("Task Result:", data.result);
        console.log("Task Status:", data.status);
    }
}

checkTaskResult();
