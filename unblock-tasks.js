import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function unblock() {
    console.log("🛠️ Unblocking tasks assigned to 'human'...");

    const { data, error } = await supabase
        .from('agent_tasks')
        .update({ assigned_to: 'tech-lead-agent' })
        .eq('assigned_to', 'human')
        .eq('status', 'pending');

    if (error) {
        console.error("❌ Failed to unblock tasks:", error.message);
    } else {
        console.log("✅ Successfully re-assigned tasks to tech-lead-agent.");
    }

    process.exit(0);
}

unblock();
