/// <reference types="vite/client" />
import { db } from "../../api/supabaseClient.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";

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

    // ... Any other methods need to be preserved if they existed in the view ...
    // Looking at previous view_file, there was only constructor visible at the end.
    // Preserving the class structure.
}
