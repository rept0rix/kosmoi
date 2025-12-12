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
    console.log("📡 Checking for updates (via agent_tasks)...");
    const UPDATE_ID = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await realSupabase
        .from('agent_tasks')
        .select('*')
        .eq('id', UPDATE_ID)
        .single();

    if (error || !data) {
        console.log("✅ No updates found.");
        return;
    }

    try {
        const updateData = JSON.parse(data.description);
        const remoteVersion = new Date(updateData.version).getTime();
        const localStats = fs.statSync(__filename);
        const localVersion = localStats.mtime.getTime();

        if (remoteVersion > localVersion) {
            console.log("🚀 New version detected! Downloading update...");
            console.log(`   Remote: ${updateData.version}`);

            // Backup
            fs.copyFileSync(__filename, `${__filename}.bak`);

            // Overwrite
            fs.writeFileSync(__filename, updateData.code);

            console.log("✅ Update applied. Restarting worker...");
            process.exit(0);
        } else {
            console.log("✅ Worker is up to date.");
        }
    } catch (e) {
        console.error("❌ Failed to parse update payload:", e.message);
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
import { createClient } from '@supabase/supabase-js';

// Ensure we use the Service Role Key for the worker operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const workerSupabase = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : realSupabase;

if (supabaseServiceKey) {
    console.log("🔐 Worker Supabase Client initialized with Service Role Key independently.");
} else {
    console.warn("⚠️ Service Role Key not found in env. Worker using default client (potentially limited).");
}

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

// 1. DYNAMIC TYPE: Fetch a real user ID to use as the Worker Identity
// This fixes the 409 Foreign Key error.
let WORKER_UUID = '87fbda0b-46d9-44e9-a460-395ca941fd31'; // fallback
const { data: userData } = await workerSupabase.from('users').select('id').limit(1).single();
if (userData) {
    WORKER_UUID = userData.id;
    console.log(`🆔 Worker Identity: Using existing User ID: ${WORKER_UUID}`);
} else {
    console.warn("⚠️ No users found in DB. Worker might fail to write memory.");
}

try {
    await clearMemory(agentConfig.id, WORKER_UUID);
} catch (e) {
    console.warn("⚠️ Clear memory failed (non-fatal):", e.message);
}

// Initialize Agent Service
const agent = new AgentService(agentConfig, { userId: WORKER_UUID });

async function executeTool(toolName, payload) {
    console.log(`🛠️ Executing Tool: ${toolName}`, payload);
    if (!toolName) return "Error: No tool name provided.";

    try {
        switch (toolName) {
            // ... (rest of switch)
            // We don't need to change the switch, just the caller.
            case 'sanitize_json':
                try {
                    const raw = payload.raw_data;
                    let clean = raw.trim();
                    const jsonMatch = clean.match(/```json\n([\s\S]*?)\n```/) || clean.match(/```([\s\S]*?)```/);
                    if (jsonMatch) clean = jsonMatch[1];
                    const parsed = JSON.parse(clean);
                    return JSON.stringify({ status: "success", sanitized: parsed });
                } catch (e) {
                    return JSON.stringify({ status: "error", message: "Sanitization Failed: " + e.message });
                }
            case 'execute_command':
                return new Promise((resolve) => {
                    exec(payload.command, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
                        if (error) {
                            resolve(`Error: ${error.message}\nStderr: ${stderr}`);
                        } else {
                            resolve(stdout || stderr || "Command executed successfully.");
                        }
                    });
                });
            case 'write_file':
            case 'write_code':
                const filePath = path.resolve(PROJECT_ROOT, payload.path || payload.title);
                const content = payload.content || payload.code;
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(filePath, content);
                return `File written to ${filePath}`;
            case 'read_file':
                const readPath = path.resolve(PROJECT_ROOT, payload.path);
                return fs.existsSync(readPath) ? fs.readFileSync(readPath, 'utf-8') : `Error: File not found at ${readPath}`;
            case 'list_files':
            case 'list_dir':
                return new Promise((resolve) => {
                    exec('ls -R ' + (payload.path || ''), { cwd: PROJECT_ROOT }, (error, stdout) => {
                        resolve(stdout || "Directory listed.");
                    });
                });
            case 'github_create_issue':
                const token = process.env.GITHUB_TOKEN;
                if (!token) return "Error: GITHUB_TOKEN not set";
                const repo = "rept0rix/kosmoi";
                const issueRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
                    method: 'POST',
                    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: payload.title, body: payload.body })
                });
                const issueData = await issueRes.json();
                if (!issueRes.ok) return `Error: ${JSON.stringify(issueData)}`;
                return `Issue Created: ${issueData.html_url}`;
            default:
                return `Tool ${toolName} not supported in Worker Mode.`;
        }
    } catch (e) { return `Tool Execution Failed: ${e.message}`; }
}

async function processTask(task) {
    console.log(`\n📋 Processing Task: ${task.title}`);
    console.log(`[${workerName}] Claiming task...`);
    await db.entities.AgentTasks.update(task.id, { status: 'in_progress' });

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

        const response = await agent.sendMessage(currentMessage, { simulateTools: false });
        // console.log(`🗣️ Agent Raw Output:`, response); // Debug if needed

        // 2. ROBUST ACTION PARSING
        let action = response.toolRequest;

        // Ensure we map 'type' to 'name' if name is missing (handling AgentBrain JSON output)
        if (action && !action.name && action.type) {
            // Map JSON actions to Tool Names
            if (action.type === 'tool_call') {
                action.name = action.name; // should work if structure is right
                action.payload = action.payload;
            } else if (action.type === 'write_code') {
                action.name = 'write_code';
                action.payload = { path: action.title, content: action.code };
            } else if (action.type === 'create_task') {
                action.name = 'create_task';
                action.payload = action;
            } else if (action.type === 'execute_command') { // In case it uses type instead of tool_call
                action.name = 'execute_command';
                // payload usually OK
            }
        }

        // Fallback: Check manual JSON in text if parsing failed earlier
        if (!action && response.text) {
            try {
                const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    if (data.action) {
                        action = data.action;
                        // Map again
                        if (action.type === 'write_code') {
                            action = { name: 'write_code', payload: { path: action.title, content: action.code } };
                        } else if (action.type === 'tool_call') {
                            action = { name: action.name, payload: action.payload };
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }

        if (action && action.name) {
            console.log(`✅ Detected Tool Action: ${action.name}`);
            const result = await executeTool(action.name, action.payload);
            console.log(`✅ Tool Result:`, result.substring(0, 100) + "...");
            currentMessage = `Tool '${action.name}' output:\n${result}\n\nWhat is the next step?`;
        } else if (action && !action.name) {
            console.warn("⚠️ Detected action but NAME is undefined:", action);
            currentMessage = "Error: Tool action detected but tool name is missing. Please check your JSON structure.";
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
            await workerSupabase.from('messages').insert([{
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
            // Report Heartbeat / Status (Non-blocking)
            try {
                await workerSupabase.from('company_knowledge').upsert({
                    key: 'WORKER_STATUS',
                    value: { status: 'RUNNING', last_seen: new Date().toISOString(), worker: workerName },
                    category: 'system',
                    updated_at: new Date().toISOString()
                });
            } catch (err) {
                console.warn("⚠️ Heartbeat failed (non-fatal):", err.message);
            }

            // Poll for tasks...
            // DEBUG: Diagnostic Query
            // const { count, error: countError } = await workerSupabase.from('agent_tasks').select('*', { count: 'exact', head: true });
            // console.log(`[DEBUG] Total tasks in agent_tasks: ${count} (Error: ${countError?.message})`);

            console.log(`[DEBUG] Polling Query Params: AssignedTo='${agentConfig.id}', Status=['open','pending','in_progress']`);

            const { data: tasks, error } = await workerSupabase
                .from('agent_tasks')
                .select('*')
                .eq('assigned_to', agentConfig.id)
                .in('status', ['open', 'pending', 'in_progress'])
                .limit(1);

            if (error) console.error("Polling Error Details:", JSON.stringify(error, null, 2));

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
            await workerSupabase.from('company_knowledge').upsert({
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
