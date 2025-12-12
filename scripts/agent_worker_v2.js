
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

if (!agentRole) {
    console.error("❌ Please specify an agent role using --role=<role_id>");
    process.exit(1);
}

const agentConfig = agents.find(a => a.id === agentRole || a.role.toLowerCase() === agentRole.toLowerCase());
if (!agentConfig) {
    console.error(`❌ Agent with role '${agentRole}' not found.`);
    process.exit(1);
}

console.log(`🤖 Starting V2 Worker for Agent: ${agentConfig.role} (${agentConfig.id})`);

async function main() {
    console.log("🚀 V2 Worker Loop Started.");
    const workerName = `Worker-V2-${Math.floor(Math.random() * 1000)}`;
    const WORKER_UUID = '87fbda0b-46d9-44e9-a460-395ca941fd31';

    await clearMemory(agentConfig.id, WORKER_UUID);
    const agent = new AgentService(agentConfig, { userId: WORKER_UUID });

    while (true) {
        try {
            // Heartbeat
            try {
                await workerSupabase.from('company_knowledge').upsert({
                    key: 'WORKER_STATUS',
                    value: { status: 'RUNNING', last_seen: new Date().toISOString(), worker: workerName },
                    category: 'system',
                    updated_at: new Date().toISOString()
                });
            } catch (e) { /* ignore */ }

            // Poll
            console.log(`[DEBUG] Polling agent_tasks for assigned_to='${agentConfig.id}'...`);

            const { data: tasks, error } = await workerSupabase
                .from('agent_tasks')
                .select('*')
                .eq('assigned_to', agentConfig.id)
                .in('status', ['open', 'pending', 'in_progress'])
                .limit(1);

            if (error) {
                console.error("❌ Polling Error:", JSON.stringify(error, null, 2));
            } else if (tasks && tasks.length > 0) {
                console.log(`✅ FOUND TASK: ${tasks[0].title} (ID: ${tasks[0].id})`);
                // Process task stub
                await workerSupabase.from('agent_tasks').update({ status: 'in_progress' }).eq('id', tasks[0].id);

                // Execute Tool logic (Simplified for V2 Test)
                if (tasks[0].title.includes("GitHub")) {
                    console.log("🛠 Executor: Simulating GitHub Action...");
                    // Just mark done for verification
                    await workerSupabase.from('agent_tasks').update({ status: 'done', result: "V2 Worker Successfully Picked Up Task" }).eq('id', tasks[0].id);
                    console.log("🎉 Task Marked Done!");
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
