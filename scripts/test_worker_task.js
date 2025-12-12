import 'dotenv/config';
import { db } from '../src/api/supabaseClient.js';

async function dispatchTask() {
    console.log("🚀 Dispatching Test Task to Worker Node...");

    const task = {
        title: "Verify TestOps Integration",
        description: "List the files in the current directory to verify the worker has filesystem access and is running correctly.",
        assigned_to: "github-specialist-agent", // Targeted agent
        status: "pending",
        priority: "high",
        created_at: new Date().toISOString()
    };

    const { data, error } = await db.entities.AgentTasks.create(task);

    if (error) {
        console.error("❌ Failed to create task:", error);
    } else {
        console.log("✅ Task Created!", data);
        console.log(`\n👀 watcher instructions:\n1. Look at your SECOND machine terminal.\n2. You should see "[Worker-...] Claiming task..."\n3. Then "Executing Tool: list_files"`);
    }
}

dispatchTask();
