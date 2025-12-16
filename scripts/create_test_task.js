
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestTask() {
    console.log("Creating test task...");
    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([{
            title: "List Files Task",
            description: "List files in the root directory using 'list_files' or 'execute_command'.",
            assigned_to: "tech-lead-agent", // Use a valid agent ID
            status: "pending",
            priority: "high"
        }])
        .select();

    if (error) {
        console.error("Error creating task:", error);
    } else {
        console.log("Task created:", data);
    }
}

createTestTask();
