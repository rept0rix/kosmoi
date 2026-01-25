import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- RECENT MESSAGES ---");
    const { data: messages, error: mError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (mError) console.error("Error fetching messages:", mError);
    else console.log(messages.map(m => `[${m.created_at}] ${m.role}: ${m.content}`));

    console.log("\n--- RECENT AGENT TASKS ---");
    const { data: tasks, error: tError } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (tError) console.error("Error fetching tasks:", tError);
    else console.log(tasks.map(t => `[${t.created_at}] [${t.status}] ${t.title} (Assigned to: ${t.assigned_to})`));

    process.exit(0);
}

check();
