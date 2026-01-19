
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TASK_ID = '98cfe279-8a73-4ca1-83dc-07db6af157f0';

async function inspectTask() {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('id', TASK_ID)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Full Task Record:", JSON.stringify(data, null, 2));
    }
}

inspectTask();
