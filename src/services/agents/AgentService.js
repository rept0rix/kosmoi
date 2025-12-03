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

const GEMINI_API_KEY = getApiKey();
console.log("AgentService Module Loaded. API Key present:", !!GEMINI_API_KEY);

import { getAgentById } from "./AgentRegistry.js";

/**
 * Tool Router - Now supports async fetch and delegation
 */
async function toolRouter(toolName, payload, options = {}) {
    const { userId } = options;
    switch (toolName) {
        case "delegate_task":
            // ... (delegation logic handled in AgentService, but kept here for reference if needed)
            return `[System] Delegation is handled by the AgentService directly.`;

        case "research":
        case "browser":
            await new Promise(resolve => setTimeout(resolve, 1000));
            return `[Real Tool Placeholder] Research result for: ${payload.query || JSON.stringify(payload)}`;

        case "spreadsheet":
            return "Simulated spreadsheet: Textual table instead of Excel.";

        case "crm":
            return "Simulated CRM: Interaction logged with customer.";

        case "notepad":
        case "doc-writer":
            // Save to localStorage to simulate a file system
            const filename = payload.filename || `note_${Date.now()}.md`;
            const content = payload.content || payload;

            // Store in a virtual "filesystem" in localStorage
            const fileSystem = JSON.parse(localStorage.getItem('agent_filesystem') || '{}');
            fileSystem[filename] = content;
            localStorage.setItem('agent_filesystem', JSON.stringify(fileSystem));

            // PERSIST TO SUPABASE
            if (userId) {
                await saveFileToSupabase(filename, content, options.agentId, userId);
                console.log(`[Agent Tool] Saved file to Supabase: ${filename}`);
            }

            console.log(`[Agent Tool] Saved file: ${filename}`);
            return `[System] File '${filename}' saved successfully. You can tell the user it is available in the System Documents.`;

        case "file-explorer":
            let filesList = "";

            // Local
            const fs = JSON.parse(localStorage.getItem('agent_filesystem') || '{}');
            const localFiles = Object.keys(fs);

            // Supabase
            if (userId) {
                const remoteFiles = await listFilesFromSupabase(userId);
                const remotePaths = remoteFiles.map(f => f.path);
                // Merge unique
                const allFiles = [...new Set([...localFiles, ...remotePaths])];
                filesList = allFiles.join(', ');
            } else {
                filesList = localFiles.join(', ');
            }

            return `[System] Current files: ${filesList}`;

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

            const tickets = JSON.parse(localStorage.getItem('dev_requests') || '[]');
            tickets.push(ticket);
            localStorage.setItem('dev_requests', JSON.stringify(tickets));

            // PERSIST TO SUPABASE
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
            }

            console.log(`[Dev Ticket] Created: ${ticket.title}`);
            return `[System] Dev Ticket #${ticket.id} created successfully. The Developer has been notified.`;

        case "nano_banana_api":
            const prompt = payload.prompt || "abstract design";
            const style = payload.style || "modern";

            console.log(`[Nano Banana API] Generating real image for: "${prompt}"...`);

            // Using Pollinations.ai as the backend for Nano Banana Pro
            // This ensures real, high-quality images are generated immediately.
            const enhancedPrompt = `${prompt}, ${style} style, high quality, professional design, vector art`;
            const encodedPrompt = encodeURIComponent(enhancedPrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

            // We can also use the Gemini Key from env if we needed to enhance the prompt further, 
            // but for now, direct generation is faster and more reliable.

            return `[Nano Banana Pro] Image generated successfully: ![Generated Image](${imageUrl})
URL: ${imageUrl}`;

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
            // Fallback to local storage if no user (or anon)
            try {
                const raw = localStorage.getItem(`agent_memory_${this.config.id}`);
                if (raw) this.history = JSON.parse(raw);
            } catch { }
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
            try {
                localStorage.setItem(`agent_memory_${this.config.id}`, JSON.stringify(this.history));
            } catch (e) { console.warn("Local storage save failed", e); }
        }

        // Handle tools
        if (simulateTools && response.toolRequest) {
            const toolName = response.toolRequest.name;
            const payload = response.toolRequest.payload;

            let toolResult;

            if (toolName === 'delegate_task') {
                toolResult = await this.handleDelegation(payload);
            } else {
                toolResult = await toolRouter(toolName, payload, { userId: this.userId, agentId: this.config.id });
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
        const apiKey = GEMINI_API_KEY;
        console.log("AgentService: API Key present:", !!apiKey);

        if (!apiKey) {
            console.error("AgentService: Missing API Key");
            throw new Error("Missing GEMINI API key");
        }

        const contents = messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const body = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: this.systemPrompt }]
            }
        };

        let modelName = this.config.model;
        // Using gemini-2.0-flash as it is available and fast for this user
        if (modelName === 'gemini-3-pro') modelName = 'gemini-2.0-flash';

        console.log(`AgentService: Using model ${modelName}`);

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
            const text =
                data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

            const toolRequest = this.extractToolRequest(text);

            return { text, raw: data, toolRequest };
        } catch (error) {
            console.error("AgentService: Fetch error", error);
            throw error;
        }
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
