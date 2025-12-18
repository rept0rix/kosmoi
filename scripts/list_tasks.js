
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTasks() {
    console.log("📋 Listing all tasks...");

    const { data: tasks, error } = await supabase
        .from('agent_tasks')
        .select('*');

    if (error) {
        console.error("Error:", error);
        return;
    }

    tasks.forEach(t => {
        console.log(`[${t.status}] ${t.title} (ID: ${t.id}) - Assigned: ${t.assigned_to}`);
    });
}

listTasks();
