
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createTestTask() {
    console.log("Creating test task...");
    const { data, error } = await supabase.from('agent_tasks').insert([{
        title: "Test Task 123",
        description: "Verify worker can execute and complete tasks.",
        assigned_to: "tech-lead-agent",
        status: "pending",
        priority: "high",
        meeting_id: "fe6e3127-01f5-4800-b083-7c9ce2285b05" // Use an existing meeting ID if possible
    }]).select();

    if (error) console.error(error);
    else console.log("Task created:", data);
}

createTestTask();
