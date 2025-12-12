import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline'; // Import readline

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

global.localStorage = {
    _data: {},
    getItem: function (key) { return this._data[key] || null; },
    setItem: function (key, value) { this._data[key] = value; },
    removeItem: function (key) { delete this._data[key]; },
    clear: function () { this._data = {}; }
};

// Set Service Role Key to bypass RLS
if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    global.localStorage.setItem('sb-access-token', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
    console.log("🔑 Worker running with Service Role Privileges");
}

// --- OTA AUTO-UPDATE LOGIC ---
async function checkForUpdates() {
    console.log("📡 Checking for updates...");
    const { data, error } = await realSupabase
        .from('company_knowledge')
        .select('*')
        .eq('key', 'WORKER_CODE_LATEST')
        .single();

    if (error || !data || !data.value) {
        console.log("✅ No updates found or registry empty.");
        return;
    }

    const remoteVersion = new Date(data.value.version).getTime();
    const localStats = fs.statSync(__filename);
    const localVersion = localStats.mtime.getTime();

    if (remoteVersion > localVersion) {
        console.log("🚀 New version detected! Downloading update...");
        console.log(`   Remote: ${data.value.version}`);
        console.log(`   Local:  ${localStats.mtime.toISOString()}`);

        // Backup current version just in case
        fs.copyFileSync(__filename, `${__filename}.bak`);

        // Overwrite Self
        fs.writeFileSync(__filename, data.value.code);

        console.log("✅ Update applied. Restarting worker...");
        process.exit(0); // Exit to let the runner loop restart it, or if manual, user must restart.
        // Ideally we should spawn a new process, but for now exit is safest signal.
    } else {
        console.log("✅ Worker is up to date.");
    }
}
// -----------------------------

// --- LOGGING OVERRIDE ---
const logFile = path.join(process.cwd(), 'worker.log');
const originalLog = console.log;
const originalError = console.error;

function logToFile(type, args) {
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ');
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${type}] ${message}\n`;
    fs.appendFileSync(logFile, logLine);
}

console.log = function (...args) {
    originalLog.apply(console, args);
    logToFile('INFO', args);
};

console.error = function (...args) {
    originalError.apply(console, args);
    logToFile('ERROR', args);
};
// ------------------------

// Import services
// Note: We need to use absolute paths or handle imports carefully in Node
// Since package.json has "type": "module", we can use imports.
import { db, realSupabase } from '../src/api/supabaseClient.js';
import { AgentService } from '../src/services/agents/AgentService.js';
import { agents } from '../src/services/agents/AgentRegistry.js';
import { clearMemory } from '../src/services/agents/memorySupabase.js';

// Config loaded
import { db, realSupabase } from '../src/api/supabaseClient.js';

// Parse CLI args
const args = process.argv.slice(2);
const roleArg = args.find(arg => arg.startsWith('--role='));
const agentRole = roleArg ? roleArg.split('=')[1] : null;

const nameArg = args.find(arg => arg.startsWith('--name='));
const workerName = nameArg ? nameArg.split('=')[1] : `Worker-${Math.floor(Math.random() * 1000)}`;


if (!agentRole) {
    console.error("❌ Please specify an agent role using --role=<role_id>");
    console.log("Available agents:", agents.map(a => a.id).join(', '));
    process.exit(1);
}

const agentConfig = agents.find(a => a.id === agentRole || a.role.toLowerCase() === agentRole.toLowerCase());

if (!agentConfig) {
    console.error(`❌ Agent with role '${agentRole}' not found.`);
    process.exit(1);
}

console.log(`🤖 Starting Worker for Agent: ${agentConfig.role} (${agentConfig.id})`);
console.log(`📂 Project Root: ${PROJECT_ROOT}`);

// Override System Prompt for Worker Mode
agentConfig.systemPrompt += `
\n\n
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine.
1. You ARE allowed and EXPECTED to use 'execute_command', 'write_code', 'read_file' directly.
2. Ignore any previous instructions about delegating tasks or using 'create_task'.
3. EXECUTE the task description immediately using the appropriate tool.
4. Do not ask for permission. Just do it.
`;

// Clear memory to avoid "refusal loops" from previous runs
console.log("🧹 Clearing Agent Memory for fresh start...");
const WORKER_UUID = '87fbda0b-46d9-44e9-a460-395ca941fd31';
await clearMemory(agentConfig.id, WORKER_UUID);

// Initialize Agent Service
const agent = new AgentService(agentConfig, { userId: WORKER_UUID }); // Use a static ID for the worker

async function executeTool(toolName, payload) {
    console.log(`🛠️ Executing Tool: ${toolName}`, payload);

    try {
        switch (toolName) {
            case 'sanitize_json':
                try {
                    // "Smart Model" Validation Simulation
                    // In a real dual-model setup, this would call GPT-4o with "Structured Output".
                    // Here, we use strict parsing and error correction.
                    const raw = payload.raw_data;
                    let clean = raw.trim();
                    // Attempt to extract JSON from markdown code blocks if present
                    const jsonMatch = clean.match(/```json\n([\s\S]*?)\n```/) || clean.match(/```([\s\S]*?)```/);
                    if (jsonMatch) clean = jsonMatch[1];

                    const parsed = JSON.parse(clean);
                    return JSON.stringify({ status: "success", sanitized: parsed });
                } catch (e) {
                    return JSON.stringify({ status: "error", message: "Sanitization Failed: " + e.message, hint: "Raw data was not valid JSON." });
                }
            case 'execute_command':
                return new Promise((resolve) => {
                    exec(payload.command, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
                        if (error) {
                            resolve(`Error: ${error.message}\nStderr: ${stderr}`);
                        } else {
                            resolve(stdout || stderr || "Command executed successfully (no output).");
                        }
                    });
                });

            case 'write_file':
            case 'write_code':
                const filePath = path.resolve(PROJECT_ROOT, payload.path || payload.title); // Handle both formats
                const content = payload.content || payload.code;

                // Ensure dir exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(filePath, content);
                return `File written to ${filePath}`;

            case 'read_file':
                const readPath = path.resolve(PROJECT_ROOT, payload.path);
                if (fs.existsSync(readPath)) {
                    return fs.readFileSync(readPath, 'utf-8');
                } else {
                    return `Error: File not found at ${readPath}`;
                }

            case 'list_files':
                return new Promise((resolve) => {
                    exec('ls -R', { cwd: PROJECT_ROOT }, (error, stdout) => {
                        resolve(stdout);
                    });
                });

            case 'github_create_issue':
                // payload: { title, body }
                // Escape quotes simply for now. Ideally use spawn with args array but exec is simpler for this POC.
                const title = payload.title.replace(/"/g, '\\"');
                const body = payload.body.replace(/"/g, '\\"');
                return executeTool('execute_command', {
                    command: `gh issue create --title "${title}" --body "${body}"`
                });

            case 'github_create_pr':
                // payload: { title, body, head, base }
                const prTitle = payload.title.replace(/"/g, '\\"');
                const prBody = payload.body.replace(/"/g, '\\"');
                const base = payload.base || 'main'; // default
                return executeTool('execute_command', {
                    command: `gh pr create --title "${prTitle}" --body "${prBody}" --base "${base}"`
                });

            case 'list_dir': // Alias for list_files because agents sometimes use this name
                return executeTool('execute_command', { command: `ls -R ${payload.path || ''}` });

            default:
                return `Tool ${toolName} not supported in Worker Mode yet. Valid tools: execute_command, write_code, list_files, github_create_issue.`;
        }
    } catch (e) {
        return `Tool Execution Failed: ${e.message}`;
    }
}

async function processTask(task) {
    console.log(`\n📋 Processing Task: ${task.title}`);

    // 1. Mark as In Progress (and tag worker)
    // We append the worker name to the task description temporarily or just log it?
    // Better: Update the status to 'in_progress' and maybe we can use a metadata field if exists.
    // For now, let's just log it to the console which goes to the file.
    console.log(`[${workerName}] Claiming task...`);
    await db.entities.AgentTasks.update(task.id, { status: 'in_progress' });

    // Announce in chat/memory
    try {
        await realSupabase.from('agent_memory').insert([{
            agent_id: agentRole,
            user_id: WORKER_UUID,
            message: `🤖 [${workerName}] I am starting task: "${task.title}"`,
            context: { taskId: task.id },
            type: 'status_update'
        }]);
    } catch (announceError) {
        console.warn("⚠️ Failed to announce task start (non-critical):", announceError.message);
    }

    // 2. Send to Agent
    const prompt = `
You have been assigned a task:
TITLE: ${task.title}
DESCRIPTION: ${task.description}

Please execute this task using your available tools.
If you need to run commands, use 'execute_command'.
If you need to write code, use 'write_code'.

When finished, reply with "TASK_COMPLETED".
`;

    let currentMessage = prompt;
    let turnCount = 0;
    const MAX_TURNS = 10;

    while (turnCount < MAX_TURNS) {
        turnCount++;
        console.log(`\n🔄 Turn ${turnCount}...`);

        // Call Agent (simulateTools: false so we handle them)
        const response = await agent.sendMessage(currentMessage, { simulateTools: false });
        console.log(`🗣️ Agent Raw Response:\n${response.text}\n---End Response---`);

        // Check for Tool Call (JSON action or parsed toolRequest)
        let action = response.toolRequest;

        // Also check for the new JSON action format from AgentBrain
        if (!action && response.raw) {
            try {
                // AgentBrain returns { message, action }
                // But AgentService.sendMessage returns { text, raw, toolRequest, plan }
                // We might need to parse the text again if AgentService didn't catch the new format
                // The new format is inside the text as JSON.
                const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    if (data.action && data.action.type === 'tool_call') {
                        action = { name: data.action.name, payload: data.action.payload };
                    } else if (data.action && (data.action.type === 'write_code' || data.action.type === 'create_task')) {
                        // Map legacy actions to tools
                        if (data.action.type === 'write_code') {
                            action = { name: 'write_code', payload: { path: data.action.title, content: data.action.code } };
                        }
                    }
                }
            } catch (e) {
                console.warn("⚠️ Failed to parse manual JSON:", e.message);
            }
        }

        if (action) {
            console.log(`✅ Detected Tool Action: ${action.name}`);
            const result = await executeTool(action.name, action.payload);
            console.log(`✅ Tool Result:`, result.slice(0, 100) + "...");



            // Feed result back to agent
            currentMessage = `Tool '${action.name}' output:\n${result}\n\nWhat is the next step?`;
        } else {
            // No tool call. Check if done.
            if (response.text.includes("TASK_COMPLETED") || response.text.includes("TERMINATE")) {
                console.log("✅ Task Completed by Agent.");
                await db.entities.AgentTasks.update(task.id, {
                    status: 'done',
                    result: response.text
                });
                return;
            }

            // If no tool and no completion, just continue conversation or stop?
            console.log("⚠️ No tool called and not completed. Agent might be confused.");

            // Force fail if we are stuck in a loop without actions
            if (turnCount >= 3) {
                console.error("❌ Task Failed: Agent is not calling tools.");
                await db.entities.AgentTasks.update(task.id, { status: 'done', result: "FAILED: Agent failed to execute tools. Raw response: " + response.text.substring(0, 200) });
                return;
            }

            // Try to nudge the agent
            currentMessage = "You have not executed the command yet. Please use the 'execute_command' tool now.";
        }
    }

    if (turnCount >= MAX_TURNS) {
        console.error("❌ Task Timeout: Max turns reached.");
        await db.entities.AgentTasks.update(task.id, { status: 'done', result: "FAILED: Timeout: Max turns reached." });
    }
}

// --- CHAT CONSOLE FEATURE ---
function setupChatConsole() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '' // No prompt to avoid cluttering logs
    });

    rl.on('line', async (line) => {
        const text = line.trim();
        if (!text) return;

        console.log(`\n📨 Sending message to Board Room: "${text}"`);

        try {
            // Insert as a message from the "User (Remote)"
            await realSupabase.from('messages').insert([{
                content: `[Remote Worker] ${text}`,
                role: 'user', // Treat as user input so Orchestrator responds!
                user_id: WORKER_UUID, // Use the worker's ID or the user's ID if available
                created_at: new Date().toISOString()
            }]);
            console.log("✅ Message sent!");
        } catch (e) {
            console.error("❌ Failed to send message:", e.message);
        }
    });
}
// ----------------------------

async function main() {
    setupChatConsole(); // <--- Enable Chat
    await checkForUpdates();
    console.log("🚀 Worker Loop Started. Polling for tasks...");
    console.log("💡 TIP: You can type here to send commands to the Board Room!");

    while (true) {
        try {
            // Report Heartbeat / Status
            await realSupabase.from('company_knowledge').upsert({
                key: 'WORKER_STATUS',
                value: { status: 'RUNNING', last_seen: new Date().toISOString(), worker: workerName },
                category: 'system',
                updated_at: new Date().toISOString()
            });

            // Poll for tasks...
            const { data: tasks, error } = await realSupabase
                .from('agent_tasks')
                .select('*')
                .eq('assigned_to', agentConfig.id)
                .in('status', ['open', 'pending', 'in_progress'])
                .limit(1);

            if (error) console.error("Polling Error:", error);

            if (tasks && tasks.length > 0) {
                console.log(`\n👀 Found ${tasks.length} tasks! First ID: ${tasks[0].id}`);
                await processTask(tasks[0]);
            } else {
                if (error) console.error("Polling Error:", error);
                // process.stdout.write('.'); // Comment out dot for now
                console.log(`[${new Date().toISOString().split('T')[1]}] Polling for ${agentConfig.id}... No tasks.`);
            }

        } catch (e) {
            console.error("\n❌ Error in Polling Loop:", e.message);

            // Report Error State
            await realSupabase.from('company_knowledge').upsert({
                key: 'WORKER_STATUS',
                value: { status: 'STOPPED', error: e.message, last_seen: new Date().toISOString(), worker: workerName },
                category: 'system',
                updated_at: new Date().toISOString()
            });

            // If it's a quota error, we might want to wait longer or just crash?
            // For now, allow the loop to continue (maybe it was transient), but the UI will know.
        }

        // Sleep 5s
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main();
