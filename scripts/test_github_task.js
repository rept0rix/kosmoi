import 'dotenv/config';
import { db } from '../src/api/supabaseClient.js';

async function dispatchGitHubTask() {
    console.log("🚀 Dispatching GitHub Task to Worker Node...");

    const task = {
        title: "Test GitHub Integration",
        description: "Create a test issue in the repository to verify the worker's gh CLI integration. Title: 'Worker Integration Test', Body: 'This issue was created by the distributed worker node.'",
        assigned_to: "github-specialist-agent",
        status: "pending", // Correct status for polling
        priority: "high",
        created_at: new Date().toISOString()
    };

    const { data, error } = await db.entities.AgentTasks.create(task);

    if (error) {
        console.error("❌ Failed to create task:", error);
    } else {
        console.log("✅ GitHub Task Created!", data);
        console.log(`\n👀 watcher instructions:\n1. Ensure Worker is RUNNING on Machine 2.\n2. Watch for '[Worker] Claiming task...'\n3. Watch for 'Executing Tool: github_create_issue' -> 'gh issue create...'`);
    }
}

dispatchGitHubTask();
