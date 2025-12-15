
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerQATest() {
    console.log("🚀 Triggering QA Verification Task...");

    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([
            {
                title: "QA Check: Project Map Existence",
                description: "Use 'read_file' to read 'PROJECT_MAP.md'. Verify it contains the text 'Where are my files?'. If yes, reply with 'TASK_COMPLETED: Verified'.",
                assigned_to: "qa-specialist-agent",
                status: "pending",
                priority: "high"
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("❌ Error creating task:", error);
    } else {
        console.log("✅ QA Task Created:", data.id);
        console.log("👉 Watch the 'npm run worker:universal' terminal for execution!");
    }
}

triggerQATest();
