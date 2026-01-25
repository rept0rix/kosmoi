import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`--- TASKS FROM ${today} ---`);

    const { data: tasks, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

    if (error) console.error("Error:", error);
    else {
        tasks.forEach(t => {
            console.log(`[${t.created_at}] [${t.status}] ${t.title}`);
            console.log(`   Assigned: ${t.assigned_to}, Created By: ${t.created_by}`);
            console.log(`   Desc: ${t.description.slice(0, 100)}...`);
            console.log("-------------------");
        });
    }

    process.exit(0);
}

check();
