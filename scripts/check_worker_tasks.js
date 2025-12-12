
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTasks() {
    console.log("🔍 Checking pending tasks for 'github-specialist-agent'...");

    const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('assigned_to', 'github-specialist-agent')
        .in('status', ['pending', 'open']);

    if (error) {
        console.error("❌ Error:", error.message);
    } else {
        console.log(`Found ${data.length} pending tasks.`);
        data.forEach(t => console.log(`- [${t.id}] ${t.title} (${t.status})`));
    }
}

checkTasks();
