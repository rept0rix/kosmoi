
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase URL or Service Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const args = process.argv.slice(2);
    const title = args[0] || "Test Task";
    const description = args[1] || "Do something.";
    const assignee = args[2] || "tech-lead-agent"; // Default assignee

    console.log(`📝 Creating Task: "${title}" for ${assignee}...`);

    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([{
            title: title,
            description: description,
            assigned_to: assignee,
            status: 'pending',
            priority: 'medium',
            created_by: 'admin-script',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error("❌ Failed to create task:", error.message);
    } else {
        console.log(`✅ Task Created! ID: ${data.id}`);
        console.log(`   (Worker should pick this up if running)`);
    }
}

main();
