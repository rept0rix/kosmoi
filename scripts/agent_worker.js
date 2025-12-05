import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Polyfills for Node.js environment
if (typeof localStorage === "undefined" || localStorage === null) {
    global.localStorage = {
        _data: {},
        getItem: function (key) { return this._data[key] || null; },
        setItem: function (key, value) { this._data[key] = value; },
        removeItem: function (key) { delete this._data[key]; },
        clear: function () { this._data = {}; }
    };
}

// Import services
// Note: We need to use absolute paths or handle imports carefully in Node
// Since package.json has "type": "module", we can use imports.
import { db, realSupabase } from '../src/api/supabaseClient.js';
import { AgentService } from '../src/services/agents/AgentService.js';
import { agents } from '../src/services/agents/AgentRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const roleArg = args.find(arg => arg.startsWith('--role='));
const agentRole = roleArg ? roleArg.split('=')[1] : null;

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

// Initialize Agent Service
const agent = new AgentService(agentConfig, { userId: 'worker-node' }); // Use a static ID for the worker

async function executeTool(toolName, payload) {
    console.log(`🛠️ Executing Tool: ${toolName}`, payload);

    try {
        switch (toolName) {
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

            default:
                return `Tool ${toolName} not supported in Worker Mode yet.`;
        }
    } catch (e) {
        return `Tool Execution Failed: ${e.message}`;
    }
}

async function processTask(task) {
    console.log(`\n📋 Processing Task: ${task.title}`);

    // 1. Mark as In Progress
    await db.entities.AgentTasks.update(task.id, { status: 'in_progress' });

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
                await db.entities.AgentTasks.update(task.id, { status: 'completed' });
                return;
            }

            // If no tool and no completion, just continue conversation or stop?
            console.log("⚠️ No tool called and not completed. Agent might be confused.");

            // Force fail if we are stuck in a loop without actions
            if (turnCount >= 3) {
                console.error("❌ Task Failed: Agent is not calling tools.");
                await db.entities.AgentTasks.update(task.id, { status: 'failed', result: "Agent failed to execute tools. Raw response: " + response.text.substring(0, 200) });
                return;
            }

            // Try to nudge the agent
            currentMessage = "You have not executed the command yet. Please use the 'execute_command' tool now.";
        }
    }

    if (turnCount >= MAX_TURNS) {
        console.error("❌ Task Timeout: Max turns reached.");
        await db.entities.AgentTasks.update(task.id, { status: 'failed', result: "Timeout: Max turns reached." });
    }
}

async function main() {
    console.log("🚀 Worker Loop Started. Polling for tasks...");

    while (true) {
        try {
            // Poll for tasks assigned to this agent (or 'Unassigned' if we want to be generous, but stick to assigned for now)
            // We need to filter by assigned_to = agentConfig.id AND status = 'open'
            // db.entities.AgentTasks.list() returns all. We need to filter client side or add filter support.
            // AgentTasks.list accepts meetingId. It doesn't seem to have generic filters in the helper.
            // Let's use realSupabase for better filtering.

            const { data: tasks, error } = await realSupabase
                .from('agent_tasks')
                .select('*')
                .eq('assigned_to', agentConfig.id)
                .in('status', ['open', 'pending']) // 'pending' might be used?
                .limit(1);

            if (error) throw error;

            if (tasks && tasks.length > 0) {
                await processTask(tasks[0]);
            } else {
                // No tasks. Pulse.
                process.stdout.write('.');
            }

        } catch (e) {
            console.error("\n❌ Error in Polling Loop:", e.message);
        }

        // Sleep 5s
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

main();
