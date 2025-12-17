
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkTasks() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('id, title, result')
        .eq('assigned_to', 'sales-pitch')
        .gt('created_at', oneHourAgo);

    console.log("Recent Sales Tasks:", tasks.length);
    tasks.forEach(t => {
        console.log(`\n[${t.title}] Result start:`, t.result ? t.result.substring(0, 150) : 'NULL');
    });
}

checkTasks();
