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

// Inject Gemini Key into mock localStorage for getClient() compatibility
const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (geminiKey) {
    global.localStorage.setItem('gemini_api_key', geminiKey);
    console.log("💎 Gemini API Key loaded into Worker Session");
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

const MAX_TURNS = 60;

async function notifyFounder(chatId, message, filePath = null) {
    const token = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!chatId || !token) return;

    try {
        if (filePath && fs.existsSync(filePath)) {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', message);
            const fileBuffer = fs.readFileSync(filePath);
            const blob = new Blob([fileBuffer]);
            formData.append('photo', blob, path.basename(filePath));

            await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        } else {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
            });
        }
    } catch (e) {
        console.error("Failed to notify founder via Telegram:", e.message);
    }
}

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

    const { error: updateError } = await workerSupabase
        .from('agent_tasks')
        .update({ status: 'in_progress' })
        .eq('id', task.id);

    if (updateError) {
        console.error("❌ Failed to claim task:", updateError.message);
        return;
    }

    const activeAgent = agentService || agent;
    const FOUNDER_CHAT_ID = "7224939578";

    // 🚀 INITIAL NOTIFICATION
    await notifyFounder(FOUNDER_CHAT_ID, `🤖 **Agent Claimed Task**\n**Task:** ${task.title}\n**Status:** Analyzing requirements and starting execution...`);

    // Set global context for executeTool
    lastAgentId = agentConfigOverride?.id || 'tech-lead-agent';
    globalUserId = activeAgent.userId || '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e';

    const prompt = `
You are in WORKER MODE. Your mission is to execute the following task COMPLETELY.
TASK: ${task.title}
DESCRIPTION: ${task.description}

RULES:
1. You MUST use tools to perform work. If you need to write code, use 'write_code'. If you need to run a server/command, use 'execute_command'.
2. If you need to take a screenshot, use 'npm run screenshot [pathname]' (e.g. 'npm run screenshot yacht-tours'). DO NOT run 'npm run dev' separately; the screenshot tool handles the server automatically.
3. If the user asked for an image, use 'generate_image'.
4. You MUST OUTPUT JSON ONLY. Structure: 
   { 
     "thought_process": "Internal plan...", 
     "message": "Public status update for the Founder. Be descriptive and helpful.", 
     "action": { "name": "tool_name", "payload": { ... } } 
   }
4. The 'message' field is sent directly to the Founder via Telegram. Use it to say "I am starting to build the page" or "I am fixing the bug now".
5. When the task is 100% finished and verified, reply with "TASK_COMPLETED" in your "message" field.
6. If you fail to use a tool, you are not making progress.

STARTING NOW.
`;

    let currentMessage = prompt;
    let turnCount = 0;
    let lastStatusUpdate = "";

    while (turnCount < MAX_TURNS) {
        turnCount++;
        console.log(`\n🔄 Turn ${turnCount}/${MAX_TURNS}...`);

        const response = await activeAgent.sendMessage(currentMessage, {
            simulateTools: false,
            bypassGuardrails: true // Worker mode uses system-generated prompts that might trigger security alerts
        });

        let action = response.toolRequest;
        let agentMessage = "";

        // Fallback: Manually parse if brain didn't catch it
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.action) action = parsed.action;
                if (parsed.message) agentMessage = parsed.message;
            } else if (response.text) {
                agentMessage = response.text;
            }
        } catch (e) { }

        // 📢 FORWARD AGENT MESSAGE TO FOUNDER
        if (agentMessage && agentMessage !== lastStatusUpdate && !agentMessage.toUpperCase().includes("TASK_COMPLETED")) {
            console.log(`💬 Agent Status: ${agentMessage}`);
            await notifyFounder(FOUNDER_CHAT_ID, `🔄 **Status Update** (${turnCount}):\n${agentMessage}`);
            lastStatusUpdate = agentMessage;
        }

        if (action && action.name) {
            console.log(`🛠️ Executing: ${action.name}`);
            let result;
            try {
                result = await executeTool(action.name, action.payload);
            } catch (e) {
                result = `Error: ${e.message}`;
            }

            console.log(`✅ Result: ${String(result).substring(0, 100)}...`);
            currentMessage = `Tool Output: ${result}\nNext step? If done, say TASK_COMPLETED.`;
        } else {
            // No tool call
            if (response.text.toUpperCase().includes("TASK_COMPLETED") || agentMessage.toUpperCase().includes("TASK_COMPLETED")) {
                console.log("🏁 Task Finished Successfully.");
                const resultSummary = agentMessage.replace(/TASK_COMPLETED/gi, '').trim() || "Task completed successfully.";

                // 📸 SCREENSHOT DETECTION
                const screenshotPath = path.resolve(process.cwd(), 'screenshot.png');
                const hasScreenshot = fs.existsSync(screenshotPath);

                await workerSupabase.from('agent_tasks')
                    .update({ status: 'done', result: resultSummary })
                    .eq('id', task.id);

                await notifyFounder(
                    FOUNDER_CHAT_ID,
                    `✅ **Background Task Finished!**\nTask: ${task.title}\n\n${resultSummary}`,
                    hasScreenshot ? screenshotPath : null
                );

                // Cleanup screenshot after sending
                if (hasScreenshot) {
                    try { fs.unlinkSync(screenshotPath); } catch (e) { }
                }
                return;
            }

            // Nudge
            console.warn("⚠️ No tool call detected. Nudging agent...");
            currentMessage = "SYSTEM: You did not call a tool. You MUST use a tool to make progress on the task. If finished, reply TASK_COMPLETED.";
        }
    }

    if (turnCount >= MAX_TURNS) {
        console.error("❌ Timeout reached.");
        await notifyFounder(FOUNDER_CHAT_ID, `❌ **Task Timed Out.**\nTask: ${task.title}\nMax turns (${MAX_TURNS}) reached.`);
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
                    currentAgentConfig.systemPrompt = `
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine. 
1. You MUST use 'execute_command', 'write_code', 'read_file' directly to perform work.
2. DO NOT delegate to yourself or other agents unless it's a massive parallel task.
3. EXECUTE the task description immediately. Do not ask for permission.
4. You have FULL ACCESS to the system tools.

` + currentAgentConfig.systemPrompt;
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
