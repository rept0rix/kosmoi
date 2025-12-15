
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestTask() {
    console.log("Creating test task for Universal Worker...");

    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([
            {
                title: "Test Universal Worker Capability - Task 2",
                description: "This is a test task. Please use the 'write_file' tool to create a file named 'universal_proof.txt' in the root directory with the content 'Universal Worker is alive!'. Then reply with 'TASK_COMPLETED'.",
                assigned_to: "agent_universal_test", // Intentionally unknown role to force fallback
                status: "pending",
                priority: "high"
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating task:", error);
    } else {
        console.log("Task created successfully:", data);
    }
}

createTestTask();
