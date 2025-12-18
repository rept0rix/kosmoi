
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetTask() {
    const taskId = 'dfbb1e49-3b76-4876-b835-d455a8a22df9';
    console.log(`🔄 Resetting task ${taskId} to 'open'...`);

    const { error } = await supabase
        .from('agent_tasks')
        .update({ status: 'pending', result: null }) // try pending
        .eq('id', taskId);

    if (error) {
        console.error("Error resetting task:", error);
    } else {
        console.log("✅ Task reset to 'open'.");
    }
}

resetTask();
