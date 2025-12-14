
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// --- FORCE LOGGING TO CONSOLE ---
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => {
    originalLog.apply(console, [`[V2 LOG]`, ...args]);
};
console.error = (...args) => {
    originalError.apply(console, [`[V2 ERR]`, ...args]);
};
// --------------------------------

import { realSupabase } from '../src/api/supabaseClient.js';
import { createClient } from '@supabase/supabase-js';
import { AgentService } from '../src/services/agents/AgentService.js';
import { agents } from '../src/services/agents/AgentRegistry.js';
import { clearMemory } from '../src/services/agents/memorySupabase.js';

// Setup Worker Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log(`🔌 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Service Key Present: ${!!supabaseServiceKey}`);

const workerSupabase = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : realSupabase;

// CLI Args
const args = process.argv.slice(2);
const roleArg = args.find(arg => arg.startsWith('--role='));
const agentRole = roleArg ? roleArg.split('=')[1] : null;

// Universal Worker Mode Flag
const isUniversal = !agentRole;
let agentConfig;

if (isUniversal) {
    console.log(`🤖 Starting Universal Worker V2`);
    console.log("🌍 Mode: Universal (Will pick up tasks for ANY agent)");
} else {
    agentConfig = agents.find(a => a.id === agentRole || a.role.toLowerCase() === agentRole.toLowerCase());
    if (!agentConfig) {
        console.error(`❌ Agent with role '${agentRole}' not found.`);
        process.exit(1);
    }
    console.log(`🤖 Starting Dedicated V2 Worker for: ${agentConfig.role} (${agentConfig.id})`);
}

async function main() {
    console.log("🚀 V2 Worker Loop Started.");
    const workerName = `Worker-V2-${Math.floor(Math.random() * 1000)}`;
    const WORKER_UUID = '87fbda0b-46d9-44e9-a460-395ca941fd31';

    // In Universal Mode, we clear memory for a default agent or skip until task pickup? 
    // Let's skip clearMemory on start for Universal to avoid confusion, or just clear a default.
    if (agentConfig) {
        await clearMemory(agentConfig.id, WORKER_UUID);
    } else {
        console.log("🧹 Universal Worker: Memory will be cleared per task context.");
    }

    while (true) {
        try {
            // Heartbeat
            try {
                await workerSupabase.from('company_knowledge').upsert({
                    key: 'WORKER_STATUS',
                    value: { status: 'RUNNING', last_seen: new Date().toISOString(), worker: workerName, mode: isUniversal ? 'universal' : 'dedicated' },
                    category: 'system',
                    updated_at: new Date().toISOString()
                });
            } catch (e) { /* ignore */ }

            // Polling
            console.log(`[DEBUG] Polling... (Universal: ${isUniversal})`);

            let query = workerSupabase
                .from('agent_tasks')
                .select('*')
                .in('status', ['open', 'pending', 'in_progress'])
                .limit(1);

            if (!isUniversal) {
                query = query.eq('assigned_to', agentConfig.id);
            }

            const { data: tasks, error } = await query;

            if (error) {
                console.error("❌ Polling Error:", JSON.stringify(error, null, 2));
            } else if (tasks && tasks.length > 0) {
                const task = tasks[0];
                console.log(`✅ FOUND TASK: ${task.title} (ID: ${task.id})`);

                // Determine Agent Logic for this task
                let currentAgentConfig;
                if (isUniversal) {
                    currentAgentConfig = agents.find(a => a.id === task.assigned_to) || agents.find(a => a.role === 'tech-lead-agent');
                    if (!currentAgentConfig) {
                        console.warn(`⚠️ Unknown agent type '${task.assigned_to}'. Using default Tech Lead.`);
                        currentAgentConfig = agents.find(a => a.role === 'tech-lead-agent');
                    }
                    console.log(`🎭 Universal Worker adapting persona: ${currentAgentConfig.role}`);
                } else {
                    currentAgentConfig = agentConfig;
                }

                // Inject Prompt
                if (!currentAgentConfig.systemPrompt.includes("WORKER MODE ACTIVE")) {
                    currentAgentConfig.systemPrompt += `
\n\n
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine.
1. You ARE allowed and EXPECTED to use 'execute_command', 'write_code', 'read_file' directly.
2. Ignore any previous instructions about delegating tasks or using 'create_task'.
3. EXECUTE the task description immediately using the appropriate tool.
4. Do not ask for permission. Just do it.
`;
                }

                // Initialize Service
                const agent = new AgentService(currentAgentConfig, { userId: WORKER_UUID });

                // Process task stub
                await workerSupabase.from('agent_tasks').update({ status: 'in_progress' }).eq('id', task.id);

                // Execute Tool logic (Simulated/Real)
                // Note: v2 seems to be a test harness. If we want it to actually run tools, we'd need the processTask logic from v1.
                // For now, retaining the existing simplified simulation behavior but adding the universal wrapper.
                // If the user wants FULL v1 capability, I should likely copy processTask. 
                // Given the file content previously showed customized logging and simplified logic, I will keep the simulation but make it compatible.
                // However, the original file had `if (tasks[0].title.includes("GitHub"))`. I will check if I should expand this.
                // The task asks to "Enable Universal Worker".

                if (task.title.includes("GitHub")) {
                    console.log("🛠 Executor: Simulating GitHub Action...");
                    await workerSupabase.from('agent_tasks').update({ status: 'done', result: "V2 Worker Successfully Picked Up Task" }).eq('id', task.id);
                    console.log("🎉 Task Marked Done!");
                } else {
                    console.log("⚠️ V2 Worker currently only simulates GitHub tasks. Update v2 to include full tool execution if needed.");
                    // Mark as done to prevent infinite loop on same task in this test script
                    // await workerSupabase.from('agent_tasks').update({ status: 'done', result: "V2 Test: Task Picked Up" }).eq('id', task.id);
                }
            } else {
                console.log(`zzz No tasks found.`);
            }

        } catch (e) {
            console.error("Global Loop Error:", e);
        }
        await new Promise(r => setTimeout(r, 5000));
    }
}

main();
