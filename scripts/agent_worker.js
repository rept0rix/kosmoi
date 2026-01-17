import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline'; // Import readline
import nodemailer from 'nodemailer'; // Added Nodemailer

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
// --- GIT SYNC LOGIC ---
async function gitSync(taskTitle) {
    if (!process.env.Git_Sync_Enabled) return;

    console.log("💾 Git Sync: Committing changes...");
    try {
        const commitMsg = `feat(worker): Auto-Task: ${taskTitle.replace(/"/g, '\\"')}`;

        await new Promise((resolve, reject) => {
            exec('git add .', { cwd: PROJECT_ROOT }, (err) => err ? reject(err) : resolve());
        });

        await new Promise((resolve, reject) => {
            exec(`git commit -m "${commitMsg}"`, { cwd: PROJECT_ROOT }, (err) => {
                // Ignore "nothing to commit" errors
                if (err && err.message.includes('nothing to commit')) resolve();
                else if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            exec('git push', { cwd: PROJECT_ROOT }, (err) => err ? reject(err) : resolve());
        });

        console.log("✅ Git Sync: Changes pushed to repo.");
    } catch (e) {
        console.error("❌ Git Sync Failed:", e.message);
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
import { AuditorSentinelService } from '../src/services/security/AuditorSentinelService.js';
import { AgentService, toolRouter } from '../src/features/agents/services/AgentService.js';
// import { AgentBrain } from '../src/features/agents/services/AgentBrain.js'; // Not used directly in worker loop yet
import { agents } from '../src/features/agents/services/AgentRegistry.js';
import { clearMemory } from '../src/features/agents/services/memorySupabase.js';
import { StripeService } from '../src/services/payments/StripeService.js'; // Import StripeService
import './WorkflowTools.js'; // Register Workflow Tools (Node only)
import { MCPClientManager } from './mcp_client.js'; // Import MCP Manager

// Config loaded
import { createClient } from '@supabase/supabase-js';

// --- ACTIVE SECURITY STATE ---
const actionHistory = new Map(); // Tracks event history per Agent Task ID
// -----------------------------

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
let agentRole = roleArg ? roleArg.split('=')[1] : null;

const nameArg = args.find(arg => arg.startsWith('--name='));
const workerName = nameArg ? nameArg.split('=')[1] : `Worker-${Math.floor(Math.random() * 1000)}`;

// Universal Worker Mode Flag
const isUniversal = !agentRole;
let agentConfig = null;

if (isUniversal) {
    console.log(`🤖 Starting Universal Worker: ${workerName}`);
    console.log("🌍 Mode: Universal (Will pick up tasks for ANY agent)");
} else {
    // Validate specific role if provided
    agentConfig = agents.find(a => a.id === agentRole || a.role.toLowerCase() === agentRole.toLowerCase());
    if (!agentConfig) {
        console.error(`❌ Agent with role '${agentRole}' not found.`);
        console.log("Available agents:", agents.map(a => a.id).join(', '));
        process.exit(1);
    }
    console.log(`🤖 Starting Dedicated Worker for: ${agentConfig.role} (${agentConfig.id})`);
}

console.log(`📂 Project Root: ${PROJECT_ROOT}`);

// Initialize MCP Manager
const mcpManager = new MCPClientManager();

let agent; // Declare global agent variable

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

if (!isUniversal && agentConfig) {
    // Override System Prompt for Worker Mode (Dedicated)
    agentConfig.systemPrompt += `
\n\n
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine.
1. You ARE allowed and EXPECTED to use 'execute_command', 'write_code', 'read_file' directly.
2. Use 'create_task' ONLY if your role is 'ceo' or 'board-chairman' and you need to delegate a sub-task. Otherwise, EXECUTE the task yourself.
3. EXECUTE the task description immediately using the appropriate tool.
4. Do not ask for permission. Just do it.
`;

    // Clear memory to avoid "refusal loops" from previous runs
    console.log("🧹 Clearing Agent Memory for fresh start...");

    try {
        await clearMemory(agentConfig.id, WORKER_UUID);
    } catch (e) {
        console.warn("⚠️ Clear memory failed (non-fatal):", e.message);
    }

    // Initialize Agent Service
    agent = new AgentService(agentConfig, { userId: WORKER_UUID });
} else {
    console.log("🌍 Universal Mode: Agent initialized dynamically per task.");
}

let lastAgentId = 'tech-lead-agent';
let globalUserId = '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e';

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
                const rawWritePath = payload.path || payload.filename || payload.title;
                if (!rawWritePath) return "Error: No path/filename provided.";
                const writeFilePath = path.resolve(PROJECT_ROOT, rawWritePath);
                const content = payload.content || payload.code;
                const dir = path.dirname(writeFilePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(writeFilePath, content);
                return `File written to ${writeFilePath}`;
            case 'read_file':
                const rawPath = payload.path || payload.filename || payload.target_file || payload.file;
                if (!rawPath) return "Error: No path provided for read_file.";
                const readPath = path.resolve(PROJECT_ROOT, rawPath);
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
            case 'create_task':
                const taskData = {
                    title: payload.title,
                    description: payload.description,
                    assigned_to: payload.assignee || 'human',
                    priority: payload.priority || 'medium',
                    status: 'pending',
                    created_by: 'tech-lead-agent'
                };
                const { data: newTask, error: taskError } = await workerSupabase
                    .from('agent_tasks')
                    .insert([taskData])
                    .select()
                    .single();

                if (taskError) throw taskError;
                return `Task Created Successfully: ${newTask.title} (ID: ${newTask.id})`;

            // --- CRM TOOLS ---
            case 'create_lead':
                const newLead = await workerSupabase
                    .from('crm_leads')
                    .insert([payload])
                    .select()
                    .single();
                if (newLead.error) return "Error creating lead: " + newLead.error.message;
                return JSON.stringify(newLead.data);

            case 'send_email':
                // PATH 1: RESEND API (Preferred - No 2FA headaches)
                const resendKey = process.env.VITE_RESEND_API_KEY;
                if (resendKey) {
                    try {
                        console.log("📧 Attempting to send via Resend API...");
                        const resendRes = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${resendKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: 'onboarding@resend.dev', // Fallback to testing domain to unblock flow
                                to: [payload.to || payload.email],
                                subject: payload.subject,
                                text: payload.body || payload.content || payload.text
                            })
                        });

                        const resendData = await resendRes.json();

                        if (!resendRes.ok) {
                            const errorMsg = `Resend API Error: ${resendData.message || resendRes.statusText}`;
                            fs.appendFileSync('worker_debug.log', `${new Date().toISOString()} [RESEND] Error: ${errorMsg}\n`);
                            // Do NOT return here. Fall through to SMTP.
                            console.warn("Resend failed, falling back to SMTP...");
                        } else {
                            const successMsg = `EMAIL SENT via Resend! ID: ${resendData.id}`;
                            fs.appendFileSync('worker_debug.log', `${new Date().toISOString()} [RESEND] Success: ${successMsg}\n`);
                            return successMsg;
                        }

                    } catch (e) {
                        fs.appendFileSync('worker_debug.log', `${new Date().toISOString()} [RESEND] Exception: ${e.message}\n`);
                        // Continue to SMTP fallback
                    }
                }

                // PATH 2: SMTP (Zoho/Gmail) as Fallback
                const emailUser = process.env.EMAIL_USER || process.env.VITE_ADMIN_EMAIL;
                let emailPass = process.env.EMAIL_APP_PASSWORD || process.env.COMPANY_EMAIL_PASSWORD;
                const emailHost = process.env.SMTP_HOST || 'smtppro.zoho.com';

                if (emailPass && emailPass.startsWith('"') && emailPass.endsWith('"')) {
                    emailPass = emailPass.slice(1, -1);
                }

                if (!emailUser || !emailPass) {
                    return "FAILED: No email credentials found (Tried Resend & SMTP). Check .env";
                }

                const transporter = nodemailer.createTransport({
                    host: emailHost,
                    port: 465,
                    secure: true,
                    auth: { user: emailUser, pass: emailPass }
                });

                try {
                    const info = await transporter.sendMail({
                        from: `"Kosmoi Agent" <${emailUser}>`,
                        to: payload.to || payload.email,
                        subject: payload.subject,
                        text: payload.body || payload.content || payload.text,
                    });
                    const successMsg = `EMAIL SENT via SMTP! Message ID: ${info.messageId}`;
                    fs.appendFileSync('worker_debug.log', `${new Date().toISOString()} [SMTP] Success: ${successMsg}\n`);
                    return successMsg;
                } catch (emailErr) {
                    const errorMsg = `EMAIL FAILED (SMTP): ${emailErr.message}. (Host: ${emailHost})`;
                    fs.appendFileSync('worker_debug.log', `${new Date().toISOString()} [SMTP] Error: ${errorMsg}\n`);
                    return errorMsg;
                }

            case 'update_lead':
                const updateRes = await workerSupabase
                    .from('crm_leads')
                    .update(payload.updates || payload) // Support {updates: {}} or directly {}
                    .eq('id', payload.id || payload.lead_id);
                if (updateRes.error) return "Error updating lead: " + updateRes.error.message;
                return "Lead updated successfully.";

            case 'insert_interaction':
                const interactRes = await workerSupabase
                    .from('crm_interactions')
                    .insert([payload]);
                if (interactRes.error) return "Error logging interaction: " + interactRes.error.message;
                return "Interaction logged successfully.";

            case 'get_lead':
                const leadRes = await workerSupabase
                    .from('crm_leads')
                    .select('*')
                    .eq('id', payload.id || payload.lead_id)
                    .single();
                if (leadRes.error) return "Error fetching lead: " + leadRes.error.message;
                return JSON.stringify(leadRes.data);

            // --- STRIPE / SALES TOOLS ---
            case 'create_payment_link':
                try {
                    // Params: businessName, productName, amount, currency, planType
                    const linkData = await StripeService.createPaymentLink(
                        "Kosmoi Inc.",
                        payload.productName || payload.name || "Service",
                        payload.amount || 100,
                        payload.currency || 'usd'
                    );
                    return JSON.stringify(linkData);
                } catch (stripeErr) {
                    return `Error creating payment link: ${stripeErr.message}`;
                }

            case 'send_email':
                // Using StripeService.sendInvoice as a proxy for sending an email, or just a mock if needed.
                // The One Dollar Challenge asks to "Send a sales email".
                try {
                    const sent = await StripeService.sendInvoice(payload.to || payload.email, payload.body || payload.content || "Link: " + payload.link);
                    return sent ? "Email sent successfully." : "Failed to send email.";
                } catch (emailErr) {
                    return `Error sending email: ${emailErr.message}`;
                }

            case 'generate_email':
                // Simple deterministic generation for now, or use LLM logic if we had access here.
                // Since the agent IS an LLM, it should generate the content itself and just use 'insert_interaction'.
                // But if it asks for a helper:
                return `Subject: Hello from Kosmoi\n\nDear Lead,\n\nWe saw you are interested in... [Generated Content Stub]`;

            default:
                // 1. Check if tool is in the ToolRegistry (via Router)
                try {
                    console.log(`📡 Routing '${toolName}' to ToolRegistry...`);
                    const registryRes = await toolRouter(toolName, payload, {
                        userId: globalUserId,
                        agentId: lastAgentId,
                        dbClient: workerSupabase,
                        approved: true // Worker mode bypasses safety queue
                    });
                    if (!registryRes.includes("not supported")) {
                        return registryRes;
                    }
                } catch (routerErr) {
                    console.warn(`ToolRegistry Router failed for ${toolName}:`, routerErr.message);
                }

                // 2. Check if it's an MCP Tool
                const mcpTools = mcpManager.getTools();
                const mcpTool = mcpTools.find(t => t.name === toolName);

                if (mcpTool) {
                    // Auto-inject projectRoot if expected by tool but missing
                    if (!payload.projectRoot) {
                        payload.projectRoot = PROJECT_ROOT;
                    }
                    return await mcpManager.callTool(toolName, payload);
                }

                return `Tool ${toolName} not supported in Worker Mode.`;
        }
    } catch (e) { return `Tool Execution Failed: ${e.message}`; }
}

async function processTask(task, agentService, agentConfigOverride) {
    console.log(`\n📋 Processing Task: ${task.title}`);
    console.log(`[${workerName}] Claiming task...`);
    console.log(`[${workerName}] Claiming task...`);
    const { error: updateError } = await workerSupabase
        .from('agent_tasks')
        .update({ status: 'in_progress' })
        .eq('id', task.id);

    if (updateError) {
        console.error("❌ Failed to claim task:", updateError.message);
        return;
    }

    // Use the override config if provided (Universal Mode), otherwise fallback to global (Dedicated Mode)
    const activeAgent = agentService || agent;
    lastAgentId = agentConfigOverride?.id || 'tech-lead-agent';
    globalUserId = agentService?.userId || '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e';

    const prompt = `
You have been assigned a task:
TITLE: ${task.title}
DESCRIPTION: ${task.description}

Please execute this task using your available tools.
AVAILABLE TOOLS:
- execute_command: Run shell commands
- write_code: Write files
- send_email: Send real emails (Resend/SMTP configured)
- create_lead: Add CRM headers
- create_lead: Add CRM headers
- create_task: Delegate work

${mcpManager.formatToolsSystemPrompt()}

If you need to run commands, use 'execute_command'.
If you need to write code, use 'write_code'.
If you need to send an email, use 'send_email'.

When finished, reply with "TASK_COMPLETED".
`;

    let currentMessage = prompt;
    let turnCount = 0;
    const MAX_TURNS = 30; // Increased to allow for complex data generation tasks

    while (turnCount < MAX_TURNS) {
        turnCount++;
        console.log(`\n🔄 Turn ${turnCount}...`);

        const response = await activeAgent.sendMessage(currentMessage, { simulateTools: false });
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
                action.payload = {
                    path: action.payload?.path || action.payload?.filename || action.title,
                    content: action.payload?.content || action.code
                };
            } else if (action.type === 'create_task') {
                action.name = 'create_task';
                action.payload = {
                    title: action.title,
                    description: action.description,
                    assigned_to: action.assignee || action.assigned_to,
                    priority: action.priority
                };
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
                            // Map 'title' or 'filename' to 'path'
                            action = {
                                name: 'write_code',
                                payload: {
                                    path: action.payload?.path || action.payload?.filename || action.title,
                                    content: action.payload?.content || action.code
                                }
                            };
                        } else if (action.type === 'tool_call') {
                            action = { name: action.name, payload: action.payload };
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }

        if (action && action.name) {
            // --- SECURITY AUDIT (SENTINEL) ---
            if (!actionHistory.has(task.id)) {
                actionHistory.set(task.id, []);
            }
            const history = actionHistory.get(task.id);

            // Audit Tool Usage
            const event = {
                agentId: task.assigned_to,
                type: 'ACTION',
                timestamp: new Date().toISOString(),
                details: action
            };
            history.push(event);

            const alerts = AuditorSentinelService.audit(history);
            const criticalAlert = alerts.find(a => a.level === 'CRITICAL' || a.level === 'ERROR');

            if (criticalAlert) {
                console.error(`🚨 SECURITY BLOCK: ${criticalAlert.issue}`);

                // Log Block Event
                history.push({
                    agentId: task.assigned_to,
                    type: 'GUARDRAIL_BLOCK',
                    timestamp: new Date().toISOString(),
                    details: criticalAlert
                });

                // KILL SWITCH: Terminate Task
                await workerSupabase.from('agent_tasks')
                    .update({
                        status: 'failed',
                        result: `SECURITY TERMINATION: ${criticalAlert.issue} - ${criticalAlert.details}`
                    })
                    .eq('id', task.id);
                return; // Stop processing loop
            }
            // ---------------------------------

            console.log(`✅ Detected Tool Action: ${action.name}`);
            let result;
            try {
                result = await executeTool(action.name, action.payload);
            } catch (e) {
                // Log Error for Loop Detection
                if (history) {
                    history.push({
                        agentId: task.assigned_to,
                        type: 'ERROR',
                        timestamp: new Date().toISOString(),
                        details: e.message
                    });
                }
                result = `Error: ${e.message}`;
            }

            console.log(`✅ Tool Result:`, result.substring(0, 100) + "...");
            currentMessage = `Tool '${action.name}' output:\n${result}\n\nWhat is the next step?`;
        } else if (action && !action.name) {
            console.warn("⚠️ Detected action but NAME is undefined:", action);
            currentMessage = "Error: Tool action detected but tool name is missing. Please check your JSON structure.";
        } else {
            // No tool call. Check if done.
            // No tool call. Check if done.
            if (response.text.toUpperCase().includes("TASK_COMPLETED") || response.text.toUpperCase().includes("TERMINATE")) {
                console.log("✅ Task Completed by Agent.");

                // Capture the text BEFORE the completion token if possible, or the whole thing
                const finalResult = response.text.replace(/TASK_COMPLETED/gi, '').trim() || response.text;

                const { error: completeError } = await workerSupabase
                    .from('agent_tasks')
                    .update({
                        status: 'done',
                        result: finalResult
                    })
                    .eq('id', task.id);

                if (completeError) console.warn("⚠️ Failed to update result:", completeError.message);

                return;
            }

            // If no tool and no completion, just continue conversation or stop?
            console.log("⚠️ No tool called and not completed. Agent might be confused.");

            // Force fail if we are stuck in a loop without actions (RELAXED LIMIT)
            if (turnCount >= MAX_TURNS) {
                console.error("❌ Task Failed: Agent is not calling tools.");
                await workerSupabase
                    .from('agent_tasks')
                    .update({ status: 'done', result: "FAILED: Agent failed to execute tools." })
                    .eq('id', task.id);
                return;
            }

            // Try to nudge the agent
            if (response.text.toLowerCase().includes("complete") || response.text.toLowerCase().includes("finished")) {
                currentMessage = "System Notification: You have indicated the task is complete. Please strictly reply with the exact text 'TASK_COMPLETED' to finalize the process.";
            } else {
                currentMessage = "Action not detected. If you have finished the task, please explicitly reply with 'TASK_COMPLETED'. Otherwise, select the appropriate tool to proceed.";
            }
        }
    }



    if (turnCount >= MAX_TURNS) {
        console.error("❌ Task Timeout: Max turns reached.");
        await workerSupabase
            .from('agent_tasks')
            .update({ status: 'done', result: "FAILED: Timeout: Max turns reached." })
            .eq('id', task.id);
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

async function checkDbSchema() {
    try {
        // Attempt to add 'result' column if it doesn't exist
        const { error } = await workerSupabase.rpc('exec_sql', {
            sql: "ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS result TEXT; ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS input_context JSONB;"
        });

        if (error && !error.message.includes('already exists')) {
            console.warn("⚠️ Failed to patch DB schema via RPC (ignoring):", error.message);
        } else {
            console.log("✅ verified 'agent_tasks' schema columns.");
        }
    } catch (e) {
        console.warn("⚠️ DB Schema check skipped:", e.message);
    }
}

async function main() {
    setupChatConsole(); // <--- Enable Chat
    await checkDbSchema(); // <--- Verify DB
    await mcpManager.init(); // <--- Init MCP (Connects to Chrome, etc.)
    await checkForUpdates();

    // AUTO-UPDATE: Start with a fresh codebase
    console.log("🔄 Startup: Ensuring code is up to date...");
    try {
        await new Promise(r => exec('git pull', { cwd: PROJECT_ROOT }, r));
        console.log("✅ Code pulled.");
    } catch (e) {
        console.warn("⚠️ Startup update failed:", e.message);
    }

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
            console.log(`[DEBUG] Polling Query Params: Universal=${isUniversal}, AssignedTo=${isUniversal ? 'ANY' : agentRole}, Status=['open', 'pending','in_progress']`);

            let query = workerSupabase
                .from('agent_tasks')
                .select('*')
                .in('status', ['pending', 'in_progress', 'review'])
                .limit(1);

            // If dedicated worker, filter by role. If universal, grab anything (or specifically where assigned_to matches a known agent)
            if (!isUniversal) {
                query = query.eq('assigned_to', agentRole);
            }
            // For Universal, we could optionally filter for unassigned or specific pools, but "grab anything pending" is best for now.
            // But we should prioritize tasks assigned to "known agents" over generic garbage

            const { data: tasks, error } = await query;

            if (error) console.error("Polling Error Details:", JSON.stringify(error, null, 2));

            if (tasks && tasks.length > 0) {
                const task = tasks[0];
                console.log(`\n👀 Found Task: "${task.title}" (ID: ${task.id})`);
                console.log(`   Assigned To: ${task.assigned_to}`);

                // Determine Agent Logic
                let currentAgentConfig;
                if (!isUniversal) {
                    currentAgentConfig = agents.find(a => a.id === agentRole || a.role.toLowerCase() === agentRole.toLowerCase());
                } else {
                    // Dynamic Load - Robust Matching Strategy
                    // 1. Try Exact ID Match (e.g. 'agent_cmo')
                    currentAgentConfig = agents.find(a => a.id === task.assigned_to);

                    // 2. Try Role Match (e.g. 'cmo-agent')
                    if (!currentAgentConfig) {
                        currentAgentConfig = agents.find(a => a.role === task.assigned_to);
                    }

                    // 3. Try Fuzzy Role Match
                    if (!currentAgentConfig && task.assigned_to) {
                        currentAgentConfig = agents.find(a => a.role.toLowerCase().includes(task.assigned_to.toLowerCase()));
                    }

                    // 4. Default Fallback
                    if (!currentAgentConfig) {
                        console.warn(`⚠️ Unknown agent type '${task.assigned_to}'. Using default Tech Lead.`);
                        currentAgentConfig = agents.find(a => a.id === 'tech-lead-agent');
                    }
                }
                console.log(`🎭 Universal Worker adapting persona: ${currentAgentConfig.role}`);

                // Inject Worker Mode Prompt Dynamically
                // Inject Worker Mode Prompt Dynamically
                if (!currentAgentConfig.systemPrompt.includes("WORKER MODE ACTIVE")) {
                    currentAgentConfig.systemPrompt += `
\n\n
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine.
1. You ARE allowed and EXPECTED to use 'execute_command', 'write_code', 'read_file' directly.
2. Use 'create_task' ONLY if your role is 'ceo' or 'board-chairman' and you need to delegate a sub-task. Otherwise, EXECUTE the task yourself.
3. EXECUTE the task description immediately using the appropriate tool.
4. Do not ask for permission. Just do it.
`;
                }

                // Initialize Service with this config
                const dynamicAgent = new AgentService(currentAgentConfig, { userId: WORKER_UUID });

                // Process Task
                await processTask(task, dynamicAgent, currentAgentConfig);

                // 3. AUTO-COMMIT WORK
                await gitSync(task.title);
            } else {
                if (error) console.error("Polling Error:", error);
                // process.stdout.write('.'); // Comment out dot for now
                console.log(`[${new Date().toISOString().split('T')[1]}] Polling... No tasks.`);
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
