
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWorkerTask() {
    console.log("Creating test task for worker...");
    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([
            {
                title: "System Diagnostics Check",
                description: "Run a full diagnostic: 1. Check Node version. 2. List files in current directory. 3. Say 'Hello from the Worker' in the results.",
                assigned_to: "tech-lead-agent",
                priority: "high",
                status: "open"
            }
        ])
        .select();

    if (error) {
        console.error("Error creating task:", error);
    } else {
        console.log("✅ Task created successfully:", data[0].id);
        console.log("👉 Check your OTHER computer. It should pick this up in ~5 seconds.");
    }
}

createWorkerTask();
