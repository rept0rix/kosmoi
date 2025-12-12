
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestTask() {
    console.log("🚀 Creating Test GitHub Task...");

    const payload = {
        title: "Test Issue from Worker",
        body: "This is a test issue created by the distributed worker to verify API integration."
    };

    const taskData = {
        title: "GitHub Action: github_create_issue",
        description: JSON.stringify(payload),
        assigned_to: 'github-specialist-agent', // Match the role user is running!
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([taskData])
        .select();

    if (error) {
        console.error("❌ Failed to create task:", error.message);
    } else {
        console.log("✅ Task Created Successfully!");
        console.log(`   ID: ${data[0].id}`);
        console.log(`   Assigned To: ${data[0].assigned_to}`);
        console.log("\n👉 Now RESTART your worker node. It should pick this up immediately.");
    }
}

createTestTask();
