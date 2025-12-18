
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetTasks() {
    console.log("🔄 Resetting stuck tasks...");

    // Find tasks that are 'in_progress'
    const { data: tasks, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', 'in_progress');

    if (error) {
        console.error("Error fetching tasks:", error);
        return;
    }

    console.log(`Found ${tasks.length} stuck tasks.`);

    if (tasks.length > 0) {
        const { error: updateError } = await supabase
            .from('agent_tasks')
            .update({ status: 'open' })
            .in('id', tasks.map(t => t.id));

        if (updateError) {
            console.error("Error resetting tasks:", updateError);
        } else {
            console.log("✅ Tasks reset to 'open'.");
        }
    }
}

resetTasks();
