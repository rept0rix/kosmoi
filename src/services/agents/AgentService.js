/// <reference types="vite/client" />
import { db } from "../../api/supabaseClient.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";
import { getAgentReply } from "./AgentBrain.js";

// --- IMPORT ALL TOOL MODULES TO REGISTER THEM ---
import { Logger } from "../utils/Logger.js";
import "../tools/registry/McpTools.js";
import "../tools/registry/DatabaseTools.js";
import "../tools/registry/ProductivityTools.js";
import "../tools/registry/CommunicationTools.js";
import "../tools/registry/DevTools.js";
import "../tools/registry/IntegrationTools.js";
import "../tools/registry/KnowledgeTools.js";
import "../tools/registry/GrowthTools.js";

console.log("AgentService Module Loaded. Tools Registered:", ToolRegistry.getToolNames());

/**
 * Tool Router - Delegates to ToolRegistry
 * Now includes Safety Middleware.
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

            // Check if userId is a valid UUID (Required for Supabase)
            const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const validUserId = (userId && isUuid(userId)) ? userId : '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e'; // Fallback Dev ID

            try {
                const approvalData = await db.entities.AgentApprovals.create({
                    agent_id: agentId || 'unknown',
                    tool_name: toolName,
                    payload: payload,
                    status: 'pending',
                    user_id: validUserId,
                    reasoning: options.reasoning || "No reasoning provided."
                });

                return `[System] 🛑 Action PAUSED for User Approval.
The user must approve this action in the "Approval Queue".
Approval ID: ${approvalData.id}`;
            } catch (e) {
                console.error("Failed to create approval request:", e);
                return `[Error] Failed to request approval: ${e.message}`;
            }
        }
    }


    // --- LOGGING & EXECUTION ---
    Logger.info("AgentService", `Executing tool: ${toolName}`, { agentId, payload });

    try {
        const result = await ToolRegistry.execute(toolName, payload, options);
        Logger.success("AgentService", `Tool executed: ${toolName}`, { agentId, result: typeof result === 'string' && result.length > 100 ? result.slice(0, 100) + '...' : result });
        return result;
    } catch (error) {
        Logger.error("AgentService", `Tool failed: ${toolName}`, { agentId, error: error.message });
        throw error;
    }
}

import { TokenBucket } from "../utils/TokenBucket.js";

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

        // Rate Limiter: 10 requests burst, 1 refill per 2 seconds (0.5/sec)
        this.rateLimiter = new TokenBucket(10, 0.5);
    }

    /**
     * Initialize agent state/memory (optional)
     */
    async init() {
        this.initialized = true;
    }

    /**
     * Send a message to the agent and get a response.
     * @param {string} message 
     * @param {Object} options 
     */
    async sendMessage(message, options = {}) {
        if (!this.rateLimiter.take(1)) {
            return {
                text: "I'm receiving too many messages at once. Please give me a moment to catch my breath.",
                raw: null,
                toolRequest: null,
                plan: null
            };
        }

        // 1. Add User Message
        this.history.push({
            agent_id: 'HUMAN_USER',
            role: 'user',
            content: message
        });

        // 2. Call Brain
        // We pass the config and history. Context can include system state.
        const context = {
            meetingTitle: options.meetingTitle || 'Direct Chat',
            config: options.systemConfig || {},
            tasks: options.tasks || [],
            images: options.images || []
        };

        const replyData = await getAgentReply(this.config, this.history, context);

        // 3. Process Response
        const response = {
            text: replyData.message || "...",
            raw: replyData,
            toolRequest: replyData.action,
            plan: replyData.thought_process
        };

        // 4. Add Assistant Message
        this.history.push({
            agent_id: this.config.id,
            role: 'assistant',
            content: response.text
        });

        // 5. Handle Tool Execution (unless disabled)
        if (options.simulateTools !== false && response.toolRequest) {
            const toolName = response.toolRequest.name;
            const payload = response.toolRequest.payload;

            try {
                // Execute locally via Router
                const toolResult = await toolRouter(toolName, payload, {
                    userId: this.userId,
                    agentId: this.config.id
                });

                // Append Result to History
                this.history.push({
                    agent_id: 'SYSTEM',
                    role: 'system',
                    content: `Tool Output [${toolName}]: ${toolResult}`
                });

                // Recursively call for reaction? (Optional, maybe loops)
                // For now, simpler to just return. The Orchestrator usually handles turns.
            } catch (e) {
                this.history.push({
                    agent_id: 'SYSTEM',
                    role: 'system',
                    content: `Tool Error: ${e.message}`
                });
            }
        }

        return response;
    }
}

/**
 * Approve a pending tool call.
 * Executes the tool and updates the approval record.
 */
export async function approveToolCall(approvalId, userId) {
    // 1. Fetch approval record
    const approvals = await db.entities.AgentApprovals.list(userId);
    const approval = approvals.find(a => a.id === approvalId);

    if (!approval) throw new Error("Approval request not found.");

    // 2. Execute the tool
    try {
        const result = await toolRouter(approval.tool_name, approval.payload, {
            userId: userId,
            agentId: approval.agent_id,
            approved: true // Bypass safety check
        });

        // 3. Update status to approved
        await db.entities.AgentApprovals.update(approvalId, { status: 'approved' });

        return result;
    } catch (e) {
        console.error("Failed to execute approved tool:", e);
        throw e;
    }
}

/**
 * Reject a pending tool call.
 */
export async function rejectToolCall(approvalId) {
    await db.entities.AgentApprovals.update(approvalId, { status: 'rejected' });
}
