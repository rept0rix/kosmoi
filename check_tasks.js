
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasks() {
    console.log("Checking latest tasks...");

    const { data: tasks, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching tasks:", error);
        return;
    }

    if (tasks.length === 0) {
        console.log("No tasks found.");
    } else {
        console.table(tasks.map(t => ({
            id: t.id,
            created_at: new Date(t.created_at).toLocaleTimeString(),
            title: t.title,
            assigned_to: t.assigned_to,
            status: t.status,
            result: t.result ? (t.result.substring(0, 50) + "...") : "No result"
        })));
    }
}

checkTasks();
