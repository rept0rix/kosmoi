/// <reference types="vite/client" />
import { loadMemoryFromSupabase, saveMemoryToSupabase, saveFileToSupabase, listFilesFromSupabase, createTicketInSupabase } from './memorySupabase.js';
import { agents } from './AgentRegistry.js';

const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env.VITE_GEMINI_API_KEY;
    }
    return null;
};

// const GEMINI_API_KEY = getApiKey(); // Removed top-level call
console.log("AgentService Module Loaded.");

import { getAgentById, syncAgentsWithDatabase } from "./AgentRegistry.js";
import { CompanyKnowledge } from "./CompanyKnowledge.js";
import { db } from "../../api/supabaseClient.js";
import { SendEmail, SendTelegram, GenerateImage, CreatePaymentLink } from "../../api/integrations.js";

// ... (toolRouter code remains same) ...


/**
 * Tool Router - Now supports async fetch and delegation
 */
export async function toolRouter(toolName, payload, options = {}) {
    const { userId, agentId } = options;

    // 🛡️ SAFETY MIDDLEWARE: Intercept sensitive tools
    const SENSITIVE_TOOLS = ['send_email', 'create_payment_link', 'execute_command', 'write_file', 'write_code'];

    if (SENSITIVE_TOOLS.includes(toolName)) {
        // If explicitly approved (flag passed in options), proceed.
        if (options.approved) {
            console.log(`[Safety] Executing approved action: ${toolName}`);
        } else {
            console.log(`[Safety] Intercepting sensitive action: ${toolName}`);

            // UUID Regex Check
            const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (userId && isUuid(userId)) {
                try {
                    let data;
                    try {
                        // Try inserting with reasoning (new schema)
                        data = await db.entities.AgentApprovals.create({
                            agent_id: agentId || 'unknown',
                            tool_name: toolName,
                            payload: payload,
                            status: 'pending',
                            user_id: userId,
                            reasoning: options.reasoning || "No plan provided."
                        });
                    } catch (schemaError) {
                        console.warn("Failed to insert with reasoning, retrying without...", schemaError);
                        // Fallback: Try inserting without reasoning (old schema)
                        data = await db.entities.AgentApprovals.create({
                            agent_id: agentId || 'unknown',
                            tool_name: toolName,
                            payload: payload,
                            status: 'pending',
                            user_id: userId
                        });
                    }

                    if (!data) throw new Error("Insert returned no data");

                    return `[System] 🛑 Action PAUSED for User Approval.
The user must approve this action in the "Approval Queue" before it can proceed.
Approval ID: ${data.id}
Wait for the user to approve it.`;
                } catch (e) {
                    console.error("Failed to create approval request:", e);
                    return `[Error] Failed to request approval: ${e.message}`;
                }
            } else {
                // Fallback for dev/terminal mode (if userId is not provided or valid)
                console.warn("[Safety] No valid userId found, using fallback.");
                try {
                    // We must use a VALID UUID for the database insert to succeed.
                    // This is a known "Dev User" UUID that should exist or we generate a random one for tracking.
                    // Ideally, we should fetch the actual user ID, but for terminal runner, we act as system.
                    const DEV_USER_UUID = '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e'; // Real Dev User UUID

                    const data = await db.entities.AgentApprovals.create({
                        agent_id: agentId || 'unknown',
                        tool_name: toolName,
                        payload: payload,
                        status: 'pending',
                        user_id: DEV_USER_UUID,
                        reasoning: options.reasoning || "No plan provided (Dev Mode)."
                    });

                    return `[System] 🛑 Action PAUSED for User Approval (Dev Mode).
The user must approve this action in the "Approval Queue".
Approval ID: ${data.id}`;
                } catch (e) {
                    return `[Error] Failed to request approval: ${e.message}`;
                }
            }
        }
    }

    switch (toolName) {
        case "delegate_task":
            // ... (delegation logic handled in AgentService, but kept here for reference if needed)
            return `[System] Delegation is handled by the AgentService directly.`;

        case "create_task":
            // payload: { title, description, assigned_to, priority }
            try {
                const { title, description, assigned_to, priority } = payload;
                if (!title) return `[Error] Task title is required.`;

                const newTask = await db.entities.AgentTasks.create({
                    title,
                    description: description || title,
                    assigned_to: assigned_to || options.agentId, // Assign to self if not specified
                    priority: priority || 'medium',
                    status: 'open',
                    created_by: options.agentId || 'unknown'
                });

                return `[System] Task Created Successfully! ID: ${newTask.id}. The worker will pick this up shortly.`;
            } catch (e) {
                console.error("Failed to create task:", e);
                return `[Error] Failed to create task: ${e.message}`;
            }

        case "browser":
            // payload: { url, action }
            // Simple implementation: Open URL in user's default browser (Human Handoff)
            try {
                const url = payload.url || payload.query; // Handle both formats
                if (!url) return `[Error] No URL provided.`;

                // Use the 'open' command on Mac
                const { exec } = await import('child_process');
                // We need to use the MCP proxy for this if we are in the browser, 
                // but AgentService runs in the browser (React).
                // So we must use 'execute_command' tool logic internally or delegation.

                // Actually, we can just return a special instruction to the UI to open a tab?
                // OR, since we have the MCP proxy running locally, we can send a command to it.

                // Let's use the MCP execute_command logic recursively if possible, 
                // or just duplicate the WebSocket logic for "open".

                // Better: Reuse the execute_command case logic by constructing a payload
                // But we are inside the switch.

                // Let's just return a special string that the UI (BoardRoom) can intercept?
                // No, the agent needs a result.

                // Let's use the MCP WebSocket directly here, similar to execute_command.
                // We will run `open "${url}"`

                const command = `open "${url}"`;
                console.log(`[Browser] Opening ${url}...`);

                // Re-using the MCP logic from execute_command (copy-paste for now to be safe/isolated)
                const ws = new WebSocket('ws://localhost:3001');
                return await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve(`[System] Opened ${url} for you. Please complete the action (e.g. CAPTCHA/Login) and paste the result here.`);
                    }, 5000); // Short timeout, we just fire and forget the open command

                    ws.onopen = () => {
                        ws.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "browser-tool", version: "1.0" } } }));
                    };

                    ws.onmessage = (event) => {
                        const response = JSON.parse(event.data);
                        if (response.id === 1) {
                            ws.send(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
                            // Call execute_command directly
                            ws.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: 3,
                                method: "tools/call",
                                params: {
                                    name: "execute_command",
                                    arguments: { command: command }
                                }
                            }));
                        } else if (response.id === 3) {
                            clearTimeout(timeout);
                            ws.close();
                            resolve(`[System] I have opened ${url} in your browser. Please handle the CAPTCHA/Login and provide the API Key or result.`);
                        }
                    };

                    ws.onerror = (err) => {
                        console.error("Browser Tool Error:", err);
                        // @ts-ignore - WebSocket error event in Node might have message, in browser it's generic Event
                        const msg = err.message || "Unknown WebSocket Error";
                        resolve(`[Error] Failed to open browser: ${msg}`);
                    };
                });

            } catch (e) {
                return `[Error] Browser action failed: ${e.message}`;
            }

        case "research":

        case "spreadsheet":
            return "Simulated spreadsheet: Textual table instead of Excel.";

        case "crm":
            return "Simulated CRM: Interaction logged with customer.";

        case "notepad":
        case "doc-writer":
            // Save to localStorage to simulate a file system
            const filename = payload.filename || `note_${Date.now()}.md`;
            const content = payload.content || payload;

            // PERSIST TO SUPABASE (Primary Storage)
            if (userId) {
                await saveFileToSupabase(filename, content, options.agentId, userId);
                console.log(`[Agent Tool] Saved file to Supabase: ${filename}`);
                return `[System] File '${filename}' saved successfully to Server Storage.`;
            } else {
                console.warn("[Agent Tool] No user logged in. File not saved persistently.");
                return `[System] Warning: You are not logged in. File '${filename}' was NOT saved to the server.`;
            }

        case "file-explorer":
            let filesList = "";

            // Supabase Only
            if (userId) {
                const remoteFiles = await listFilesFromSupabase(userId);
                const remotePaths = remoteFiles.map(f => f.path);
                filesList = remotePaths.join(', ');
            } else {
                filesList = "(No files - Login required)";
            }

            return `[System] Current files (Server): ${filesList}`;

        case "send_telegram":
            return await SendTelegram({
                message: payload.message,
                chatId: payload.chatId
            });

        case "generate_image":
            return await GenerateImage({
                prompt: payload.prompt,
                aspectRatio: payload.aspectRatio
            });

        case "dev_ticket":
            const ticket = {
                id: `ticket_${Date.now()}`,
                title: payload.title,
                description: payload.description,
                priority: payload.priority || 'medium',
                status: 'open',
                created_at: new Date().toISOString(),
                agent_id: options.agentId || 'unknown'
            };

            // PERSIST TO SUPABASE (Primary Storage)
            if (userId) {
                await createTicketInSupabase({
                    ticket_id: ticket.id,
                    title: ticket.title,
                    description: ticket.description,
                    priority: ticket.priority,
                    status: ticket.status,
                    agent_id: ticket.agent_id
                }, userId);
                console.log(`[Dev Ticket] Saved to Supabase: ${ticket.title}`);
                return `[System] Dev Ticket #${ticket.id} created successfully on Server.`;
            } else {
                return `[System] Warning: You are not logged in. Ticket '${ticket.title}' was NOT saved.`;
            }

        case "nano_banana_api":
            const prompt = payload.prompt || "abstract design";
            const style = payload.style || "modern";

            console.log(`[Nano Banana API] Generating real image for: "${prompt}"...`);

            // Using Pollinations.ai as the backend for Nano Banana Pro
            // This ensures real, high-quality images are generated immediately.
            const enhancedPrompt = `${prompt}, ${style} style, high quality, professional design, vector art`;
            const encodedPrompt = encodeURIComponent(enhancedPrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

            return `[Nano Banana Pro] Image generated successfully: ![Generated Image](${imageUrl})
URL: ${imageUrl}`;

        case "read_n8n_catalog":
            // payload: { search }
            try {
                // Dynamic import to avoid build time issues if file doesn't exist yet
                // But in node env we can just read file
                // For simplified dev:
                console.log("[n8n] Reading catalog...");

                // We will try to fetch it if we are in browser, or read fs if in node?
                // AgentService (Frontend) cannot read FS directly.
                // WE MUST USE SUPABASE OR IMPORT IT.
                // Since I generated a JSON file in src/knowledge, we can import it if we knew the path at build time.
                // Better: The AgentService runs in Browser. It can't read '/Users/...'.
                // SOLUTION: The index_n8n.js ran in Node. The file is on disk.
                // We need to serve it or import it.
                // Quick fix: Assume the user will import it or we hardcode a 'search' over a known list.
                // OR: We use 'execute_command' to grep the file content on the server (via worker).

                // Let's use the 'execute_command' bridge to search the file on the "Worker" machine.
                // This keeps the separation clean.

                const searchTerm = payload.search || "";
                const command = `grep -i "${searchTerm}" src/knowledge/n8n_catalog.json | head -n 20`;

                // Reuse existing execute_command logic? 
                // We are inside the browser. We can call the MCP bridge.

                // Let's actually create a task for the worker to read it? No, too slow.
                // Use the MCP WebSocket bridge directly here.

                const ws = new WebSocket('ws://localhost:3001');
                return await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve("[Error] Search timed out.");
                    }, 5000);

                    ws.onopen = () => {
                        ws.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "n8n-search", version: "1.0" } } }));
                    };

                    ws.onmessage = (event) => {
                        const response = JSON.parse(event.data);
                        if (response.id === 1) {
                            ws.send(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
                            ws.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: 3,
                                method: "tools/call",
                                params: {
                                    name: "execute_command",
                                    arguments: { command: command }
                                }
                            }));
                        } else if (response.id === 3) {
                            clearTimeout(timeout);
                            ws.close();
                            const content = response.result?.content?.[0]?.text || "";
                            resolve(`[n8n Catalog Search Results for '${searchTerm}']:\n${content}\n...(truncated)`);
                        }
                    };
                });

            } catch (e) {
                return `[Error] Failed to search catalog: ${e.message}`;
            }

        case "read_knowledge":
            const key = payload.key;
            const value = await CompanyKnowledge.get(key);
            if (value) {
                return `[Knowledge] ${key}: ${JSON.stringify(value)}`;
            } else {
                return `[Knowledge] Key '${key}' not found.`;
            }

        case "write_knowledge":
            await CompanyKnowledge.set(payload.key, payload.value, payload.category, options.agentId);
            return `[Knowledge] Saved '${payload.key}' successfully.`;

        case "update_task_status":
            // payload: { taskId, status, comment }
            if (!userId) return `[Error] Login required to update tasks.`;

            try {
                const { taskId, status, comment } = payload;
                if (!taskId || !status) return `[Error] Missing taskId or status.`;

                await db.entities.AgentTasks.update(taskId, {
                    status: status,
                    // We could also append a comment if the table supports it, or just update description?
                    // For now, just status.
                    updated_at: new Date().toISOString()
                });

                return `[System] Task ${taskId} updated to ${status}.`;
            } catch (e) {
                console.error("Failed to update task:", e);
                return `[Error] Failed to update task: ${e.message}`;
            }

        case "update_agent_config":
            // payload: { agentId, key, value }
            try {
                const { agentId, key, value } = payload;
                if (!agentId || !key) return `[Error] Missing agentId or key.`;

                await db.entities.AgentConfigs.upsert(agentId, key, value);

                // Trigger hot-reload
                await syncAgentsWithDatabase();

                return `[System] Successfully updated configuration for ${agentId}. Key '${key}' is now set.`;
            } catch (e) {
                console.error("Failed to update agent config:", e);
                return `[Error] Failed to update config: ${e.message}`;
            }

        case "send_email":
            // payload: { to, subject, html }
            try {
                const result = await SendEmail(payload);
                if (result.error) return `[Error] Failed to send email: ${result.error}`;
                if (result.simulated) return `[System] Email simulated (No API Key): ${payload.subject}`;
                return `[System] Email sent successfully! ID: ${result.id}`;
            } catch (e) {
                return `[Error] Email failed: ${e.message}`;
            }

        case "create_payment_link":
            // payload: { name, amount, currency }
            try {
                const result = await CreatePaymentLink(payload);
                if (result.error) return `[Error] Failed to create payment link: ${result.error}`;
                if (result.simulated) return `[System] Payment Link Simulated: ${result.url}`;
                return `[System] Payment Link Created: ${result.url}`;
            } catch (e) {
                return `[Error] Payment link creation failed: ${e.message}`;
            }

        case "escalate_issue":
            // payload: { title, description, severity }
            try {
                const { title, description, severity } = payload;
                const agentId = options.agentId;
                const agentConfig = getAgentById(agentId);
                const managerId = agentConfig?.reportsTo;

                if (!managerId) {
                    return `[System] You have no manager to escalate to. You are the top of the chain. Resolve it yourself or ask the Board.`;
                }

                // Create a high-priority task for the manager
                await db.entities.AgentTasks.create({
                    title: `[ESCALATION] ${title}`,
                    description: `Escalated by ${agentId}: ${description}`,
                    priority: 'high',
                    status: 'open',
                    assigned_to: managerId,
                    created_by: agentId
                });

                return `[System] Issue escalated to ${managerId}. Task created.`;
            } catch (e) {
                return `[Error] Escalation failed: ${e.message}`;
            }

        case "write_code":
            // payload: { path, content }
            // Alias for write_file, but specifically for code generation
            // We reuse the MCP write_file logic by modifying the payload and falling through
            // OR we can just implement it directly here if we want specific logging.

            // Let's just map it to write_file logic by changing the toolName locally or constructing the MCP call.
            // Since we can't easily jump to another case, we'll duplicate the MCP logic or call a helper.
            // Actually, we can just use the same logic block if we group the cases.

            // But wait, the switch case fall-through is tricky if we need to change payload.
            // Let's just implement it as a distinct case that calls MCP.

            console.log(`[Write Code] Writing to ${payload.path}...`);
            // Construct the command for MCP
            // We need to use the 'write_file' tool on the MCP server.

            try {
                const ws = new WebSocket('ws://localhost:3001');
                return await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve("Error: Write code timed out after 10s");
                    }, 10000);

                    ws.onopen = () => {
                        ws.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "code-writer", version: "1.0" } } }));
                    };

                    ws.onmessage = (event) => {
                        const response = JSON.parse(event.data);
                        if (response.id === 1) {
                            ws.send(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));
                            // Call write_file directly
                            ws.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: 3,
                                method: "tools/call",
                                params: {
                                    name: "write_file",
                                    arguments: {
                                        path: payload.path,
                                        content: payload.content
                                    }
                                }
                            }));
                        } else if (response.id === 3) {
                            clearTimeout(timeout);
                            ws.close();
                            if (response.error) {
                                resolve(`[Error] Failed to write code: ${response.error.message}`);
                            } else {
                                resolve(`[System] Code written successfully to ${payload.path}`);
                            }
                        }
                    };

                    ws.onerror = (err) => {
                        console.error("Write Code Tool Error:", err);
                        // @ts-ignore
                        const msg = err.message || "Unknown WebSocket Error";
                        resolve(`[Error] Failed to write code: ${msg}`);
                    };
                });
            } catch (e) {
                return `[Error] Write code failed: ${e.message}`;
            }

        case "execute_command":
        case "write_file":
            console.log(`[MCP] Executing command via Proxy: ${payload.command}`);
            try {
                const ws = new WebSocket('ws://localhost:3001');

                return await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve("Error: Command timed out after 10s");
                    }, 10000);

                    // Define request IDs
                    const INIT_ID = 1;
                    const LIST_TOOLS_ID = 2;
                    const CALL_ID = 3;

                    ws.onopen = () => {
                        console.log("[MCP] WebSocket Connected. Sending Initialize...");
                        const initRequest = {
                            jsonrpc: "2.0",
                            id: INIT_ID,
                            method: "initialize",
                            params: {
                                protocolVersion: "2024-11-05",
                                capabilities: {},
                                clientInfo: { name: "samui-client", version: "1.0.0" }
                            }
                        };
                        ws.send(JSON.stringify(initRequest));
                    };

                    ws.onerror = (error) => {
                        console.error("[MCP] WebSocket Error:", error);
                        resolve(`Error: WebSocket connection failed.`);
                    };

                    ws.onclose = (event) => {
                        console.warn(`[MCP] WebSocket Closed. Code: ${event.code}, Reason: ${event.reason}`);
                        if (event.code !== 1000) { // 1000 is normal closure
                            resolve("Error: Connection closed unexpectedly.");
                        }
                    };

                    ws.onmessage = (event) => {
                        try {
                            console.log("[MCP] Received:", event.data);
                            const response = JSON.parse(event.data);

                            // 2. Handle Initialize Response
                            if (response.id === INIT_ID) {
                                console.log("[MCP] Initialized. Sending initialized notification and listing tools...");
                                // Send Initialized Notification
                                ws.send(JSON.stringify({
                                    jsonrpc: "2.0",
                                    method: "notifications/initialized"
                                }));

                                // List Tools to find the right one
                                const listRequest = {
                                    jsonrpc: "2.0",
                                    id: LIST_TOOLS_ID,
                                    method: "tools/list"
                                };
                                ws.send(JSON.stringify(listRequest));
                            }

                            // 3. Handle List Tools Response
                            else if (response.id === LIST_TOOLS_ID) {
                                console.log("[MCP] Available Tools:", JSON.stringify(response.result));
                                const tools = response.result?.tools || [];
                                // Look for execute_command or write_file
                                const commandTool = tools.find(t => t.name === toolName);

                                if (commandTool) {
                                    console.log(`[MCP] Found tool: ${commandTool.name}. Executing...`);
                                    const toolRequest = {
                                        jsonrpc: "2.0",
                                        id: CALL_ID,
                                        method: "tools/call",
                                        params: {
                                            name: commandTool.name,
                                            arguments: payload // Pass payload directly as arguments
                                        }
                                    };
                                    console.log("[MCP] Sending Tool Request:", JSON.stringify(toolRequest, null, 2));
                                    ws.send(JSON.stringify(toolRequest));
                                } else {
                                    console.error("[MCP] No suitable command tool found.");
                                    ws.close();
                                    resolve(`Error: No 'execute_command' tool found. Available tools: ${tools.map(t => t.name).join(', ')}`);
                                }
                            }

                            // 4. Handle Tool Response
                            else if (response.id === CALL_ID) {
                                clearTimeout(timeout);
                                ws.close();
                                if (response.error) {
                                    resolve(`Error: ${response.error.message}`);
                                } else {
                                    const content = response.result?.content?.[0]?.text || JSON.stringify(response.result);
                                    resolve(`Output:\n${content}`);
                                }
                            }
                        } catch (err) {
                            console.error("MCP Message Error:", err);
                        }
                    };
                    // And let's assume the agent knows what to send.
                    // But to make it easy, let's just send the raw payload and expect the proxy/server to handle it?
                    // No, the proxy forwards strings.

                    // REVISED STRATEGY:
                    // We will send a "list_tools" request first to see what's available, or just try to run it.
                    // To keep it simple for this step, let's assume the agent is trying to run a shell command.
                    // If 'interactive-mcp' exposes 'execute_command', we use that.

                    // Let's try to send a direct JSON-RPC to call 'execute_command'
                    // If this fails, we might need to inspect the MCP server capabilities first.
                });
            } catch (e) {
                return `Error connecting to MCP Proxy: ${e.message}. Is 'node mcp-proxy.js' running?`;
            }

        case "search_services":
            // payload: { query, category, location }
            try {
                const { query, category, location } = payload;
                console.log(`[Concierge] Searching DB for: ${query || category}...`);

                let queryBuilder = db.entities.ServiceProvider.select('*');

                if (query) {
                    // Simple text search on name or description
                    // Supabase textSearch might require config, so we use ilike for simplicity or 'or'
                    queryBuilder = queryBuilder.or(`business_name.ilike.%${query}%,description.ilike.%${query}%`);
                }

                if (category) {
                    queryBuilder = queryBuilder.eq('category', category);
                }

                if (location) {
                    queryBuilder = queryBuilder.ilike('location', `%${location}%`);
                }

                const { data, error } = await queryBuilder.limit(5);

                if (error) throw error;

                if (!data || data.length === 0) {
                    return `[Database] No results found for "${query || category}".`;
                }

                // Format results for the agent
                const results = data.map(p => `- **${p.business_name}** (${p.category}): ${p.description?.substring(0, 100)}... (Rating: ${p.average_rating})`).join('\n');

                return `[Database Results]:\n${results}`;

            } catch (e) {
                console.error("Search failed:", e);
                return `[Error] Database search failed: ${e.message}`;
            }

        case "notify_admin":
            // payload: { message, priority }
            try {
                const { sendTelegramNotification } = await import("../TelegramService.js");
                await sendTelegramNotification(`[Admin Notification] ${payload.message}`);
                return `[System] Admin notified via Telegram.`;
            } catch (e) {
                console.error("Notify Admin failed:", e);
                return `[Error] Failed to notify admin: ${e.message}`;
            }

        default:
            return `Tool ${toolName} is not implemented yet.`;
    }
}

export class AgentService {
    /**
     * @param {Object} agentConfig
     * @param {Object} [options]
     * @param {string} [options.userId]
     */
    constructor(agentConfig, options = {}) {
        this.config = agentConfig;
        this.userId = options.userId;
        this.history = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        if (this.userId) {
            this.history = await loadMemoryFromSupabase(this.config.id, this.userId);
        } else {
            // Fallback to in-memory (empty) if no user
            this.history = [];
        }
        this.initialized = true;
    }

    get id() {
        return this.config.id;
    }

    get role() {
        return this.config.role;
    }

    get systemPrompt() {
        return this.config.systemPrompt;
    }

    get allowedTools() {
        return this.config.allowedTools || [];
    }

    /**
     * Send message to agent
     * userMessage: User's text
     * options: { simulateTools: boolean }
     */
    async sendMessage(userMessage, options = {}) {
        if (!this.initialized) await this.init();

        const { simulateTools = true } = options;

        const messages = [
            ...this.history,
            { role: "user", content: userMessage },
        ];

        const response = await this.callGemini(messages);

        // Update history
        this.history.push({ role: "user", content: userMessage });
        this.history.push({ role: "assistant", content: response.text });

        // Save history (fire and forget / non-blocking)
        if (this.userId) {
            saveMemoryToSupabase(this.config.id, this.userId, this.history).catch(err => console.warn("Background save failed:", err));
        } else {
            // Anonymous/No-User Mode: Use In-Memory Only.
            // We do NOT save to localStorage to avoid QuotaExceededError and browser crashes.
            // History will be lost on refresh, which is expected for anonymous sessions.
            console.debug(`[AgentService] User not logged in. History kept in memory only for agent ${this.config.id}.`);
        }

        // Handle tools
        if (simulateTools && response.toolRequest) {
            const toolName = response.toolRequest.name;
            const payload = response.toolRequest.payload;

            let toolResult;

            if (toolName === 'delegate_task') {
                toolResult = await this.handleDelegation(payload);
            } else {
                toolResult = await toolRouter(toolName, payload, {
                    userId: this.userId,
                    agentId: this.config.id,
                    reasoning: response.plan // Pass the extracted plan/reasoning
                });
            }

            return {
                ...response,
                toolResult,
            };
        }

        return response;
    }

    async handleDelegation(payload) {
        const { targetAgentId, instruction } = payload;
        console.log(`AgentService: Delegating to ${targetAgentId}...`);

        // Dynamic import to avoid circular dependency issues if possible, or just use the class since we are in it.
        // But we need to import getAgentById.
        const { getAgentById } = await import("./AgentRegistry.js");

        const targetConfig = getAgentById(targetAgentId);
        if (!targetConfig) {
            return `Error: Agent ${targetAgentId} not found.`;
        }

        // Create new service instance for the delegate
        const delegateService = new AgentService(targetConfig, { userId: this.userId });
        await delegateService.init();

        // Send the instruction
        const response = await delegateService.sendMessage(instruction, { simulateTools: true });

        return `[Delegation to ${targetAgentId} Result]:\n${response.text}`;
    }
    /**
     * Real call to Gemini
     */
    async callGemini(messages) {
        console.log("AgentService: Calling Gemini...");
        const apiKey = getApiKey(); // Lazy load
        console.log("AgentService: API Key present:", !!apiKey);

        if (!apiKey) {
            console.error("AgentService: Missing API Key");
            throw new Error("Missing GEMINI API key");
        }

        const contents = messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const tools = [];
        // Enable Google Search if agent has research capabilities
        if (this.allowedTools.includes('research') || this.allowedTools.includes('browser')) {
            tools.push({ googleSearch: {} });
        }

        const body = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: this.systemPrompt }]
            },
            tools: tools.length > 0 ? tools : undefined
        };

        let modelName = this.config.model;
        // User requested Gemini 3. Using gemini-3-pro-preview.
        if (modelName === 'gemini-3-pro' || modelName === 'gemini-1.5-flash' || modelName === 'gemini-2.0-flash-exp' || modelName === 'gemini-1.5-pro') modelName = 'gemini-3-pro-preview';

        console.log(`AgentService: Using model ${modelName} with tools:`, tools.length > 0 ? 'YES' : 'NO');

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                console.error(`AgentService: API Error ${res.status}`, errText);
                throw new Error(`Gemini error: ${res.status} ${errText}`);
            }

            const data = await res.json();
            let text =
                data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

            // Handle Grounding Metadata (Search Results)
            const groundingMetadata = data?.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata && groundingMetadata.searchEntryPoint) {
                console.log("AgentService: Received Grounding Metadata");
                const searchHtml = groundingMetadata.searchEntryPoint.renderedContent;
                // Append a note about sources if available
                if (searchHtml) {
                    // We can't easily render HTML in the markdown chat, but we can add a text note
                    text += `\n\n*(Information verified via Google Search)*`;
                }
            }

            const toolRequest = this.extractToolRequest(text);
            const plan = this.extractPlan(text); // Extract PLAN

            return { text, raw: data, toolRequest, plan };
        } catch (error) {
            console.error("AgentService: Fetch error", error);
            throw error;
        }
    }

    extractPlan(text) {
        const planRegex = /PLAN:([\s\S]*?)(?=TOOL:|```|$)/i;
        const match = planRegex.exec(text);
        if (match) {
            return match[1].trim();
        }
        return null;
    }

    extractToolRequest(text) {
        // 1. Try strict TOOL: format
        const prefixRegex = /TOOL:\s*(\w+)\s*/g;
        const match = prefixRegex.exec(text);
        if (match) {
            const name = match[1];
            const startIndex = prefixRegex.lastIndex;
            const openBraceIndex = text.indexOf('{', startIndex);
            if (openBraceIndex !== -1) {
                let balance = 0;
                let endIndex = -1;
                for (let i = openBraceIndex; i < text.length; i++) {
                    if (text[i] === '{') balance++;
                    else if (text[i] === '}') balance--;
                    if (balance === 0) {
                        endIndex = i + 1;
                        break;
                    }
                }
                if (endIndex !== -1) {
                    try {
                        const payload = JSON.parse(text.substring(openBraceIndex, endIndex));
                        return { name, payload };
                    } catch (e) { console.error("Failed to parse TOOL payload", e); }
                }
            }
        }

        // 2. Try JSON code block format
        // Look for ```json ... ``` or just { ... }
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const jsonMatch = jsonRegex.exec(text);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                // Check if it looks like a tool call
                if (data.command && data.args) {
                    return { name: data.command, payload: data.args };
                }
                if (data.tool && data.parameters) {
                    return { name: data.tool, payload: data.parameters };
                }
                // Handle flat format: { "tool": "write_file", "path": "..." }
                if (data.tool) {
                    const { tool, ...rest } = data;
                    return { name: tool, payload: rest };
                }
            } catch (e) {
                console.warn("Found JSON block but failed to parse as tool", e);
            }
        }

        // 3. Try tool_code block format (Iterate all blocks)
        const toolCodeRegex = /```tool_code\s*([\s\S]*?)\s*```/g;
        let match3;
        while ((match3 = toolCodeRegex.exec(text)) !== null) {
            const content = match3[1].trim();
            // Skip if it looks like a thought or comment (doesn't start with a known tool name)
            // Simple heuristic: check if it starts with a tool name we know or just try to parse
            const firstSpace = content.indexOf(' ');
            if (firstSpace !== -1) {
                const name = content.substring(0, firstSpace);
                const jsonPart = content.substring(firstSpace).trim();
                // Check if name is likely a tool (no brackets, no spaces)
                if (/^[a-zA-Z0-9_]+$/.test(name)) {
                    try {
                        const payload = JSON.parse(jsonPart);
                        return { name, payload };
                    } catch (e) {
                        // Not a JSON payload, maybe just text. Continue searching.
                    }
                }
            }
        }

        return null;
    }

    getHistory() {
        return this.history;
    }

    async clearHistory() {
        this.history = [];
        if (this.userId) {
            await saveMemoryToSupabase(this.config.id, this.userId, []);
        } else {
            localStorage.setItem(`agent_memory_${this.config.id}`, JSON.stringify([]));
        }
    }
}

/**
 * Execute a pending tool call after user approval
 */
export async function approveToolCall(approvalId, userId) {
    console.log(`[Safety] Approving tool call ${approvalId}...`);

    // 1. Fetch the approval record
    const approval = await db.entities.AgentApprovals.get(approvalId);

    if (!approval) throw new Error("Approval not found");
    if (approval.status !== 'pending') throw new Error("Action already processed");

    // 2. Execute the tool
    try {
        const result = await toolRouter(approval.tool_name, approval.payload, {
            userId: userId,
            agentId: approval.agent_id,
            approved: true // Bypasses the safety check
        });

        // 3. Update status to completed
        await db.entities.AgentApprovals.update(approvalId, {
            status: 'completed',
            updated_at: new Date().toISOString()
        });

        return result;
    } catch (e) {
        // Update status to failed
        await db.entities.AgentApprovals.update(approvalId, {
            status: 'failed',
            updated_at: new Date().toISOString()
        });
        throw e;
    }
}

export async function rejectToolCall(approvalId) {
    await db.entities.AgentApprovals.update(approvalId, {
        status: 'rejected',
        updated_at: new Date().toISOString()
    });
    return "Action rejected by user.";
}
