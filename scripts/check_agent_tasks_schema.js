import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    const { data, error } = await supabase.from('agent_tasks').select('*').limit(1);
    if (error) {
        console.error("Error fetching agent_tasks:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns found in agent_tasks:", Object.keys(data[0]).join(', '));
    } else {
        console.log("No data in agent_tasks. Cannot check columns via select *.");
    }
}

checkSchema();
