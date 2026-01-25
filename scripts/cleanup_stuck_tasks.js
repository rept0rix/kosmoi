import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
    console.log("🧹 Cleaning up stuck and delusional tasks...");

    // 1. Cancel the delusional escalation tasks
    const { data: escalationTasks, error: escError } = await supabase
        .from('agent_tasks')
        .update({ status: 'done', result: 'Closed: Delusional execution loop identified and fixed.' })
        .or('title.ilike.%Escalate Worker Node%,title.ilike.%Monitor Worker Node%,title.ilike.%Check in with CTO%')
        .not('status', 'eq', 'done');

    if (escError) console.error("Error cancelling escalation tasks:", escError.message);
    else console.log("✅ Cancelled delusional escalation tasks.");

    // 2. Reset the main lead gen task
    const { data: leadGenTasks, error: leadError } = await supabase
        .from('agent_tasks')
        .update({ status: 'pending' })
        .eq('id', '26033b78-b0df-4c66-8c92-a684716cdbf9');

    if (leadError) console.error("Error resetting lead gen task:", leadError.message);
    else console.log("✅ Reset lead generation task to pending.");

    console.log("✨ Cleanup complete.");
}

cleanup();
