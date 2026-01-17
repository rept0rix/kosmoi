import { ToolRegistry } from "../ToolRegistry.js";
import { db } from "../../../api/supabaseClient.js";
import { createTicketInSupabase } from "../../../features/agents/services/memorySupabase.js";
import { syncAgentsWithDatabase, getAgentById } from "../../../features/agents/services/AgentRegistry.js";

ToolRegistry.register("create_task", "Delegate a task to an agent or yourself.", { title: "string", description: "string", assigned_to: "string", priority: "string" }, async (payload, options) => {
    // payload: { title, description, assigned_to, priority }
    try {
        const { title, description, assigned_to, assignee, priority } = payload;
        if (!title) return `[Error] Task title is required.`;

        const finalAssignee = assigned_to || assignee || options.agentId;

        // Normalize Priority (Allowed: low, medium, high, critical)
        let finalPriority = (priority || 'medium').toLowerCase();
        if (finalPriority === 'p0' || finalPriority === 'urgent') finalPriority = 'critical';
        if (!['low', 'medium', 'high', 'critical'].includes(finalPriority)) finalPriority = 'medium';

        const newTask = await db.entities.AgentTasks.create({
            title,
            description: description || title,
            assigned_to: finalAssignee,
            priority: finalPriority,
            status: 'pending',
            created_by: options.agentId || 'unknown'
        });

        return `[System] Task Created Successfully! ID: ${newTask.id}. The worker will pick this up shortly.`;
    } catch (e) {
        console.error("Failed to create task:", e);
        return `[Error] Failed to create task: ${e.message}`;
    }
});

ToolRegistry.register("update_task_status", "Update the status of an existing task.", { taskId: "string", status: "string" }, async (payload, options) => {
    if (!options.userId) return `[Error] Login required to update tasks.`;
    try {
        const { taskId, status } = payload;
        if (!taskId || !status) return `[Error] Missing taskId or status.`;
        await db.entities.AgentTasks.update(taskId, { status, updated_at: new Date().toISOString() });
        return `[System] Task ${taskId} updated to ${status}.`;
    } catch (e) {
        return `[Error] Failed to update task: ${e.message}`;
    }
});

ToolRegistry.register("dev_ticket", "Create a development ticket.", { title: "string", description: "string", priority: "string" }, async (payload, options) => {
    const { userId, agentId } = options;
    const ticket = {
        id: `ticket_${Date.now()}`,
        title: payload.title,
        description: payload.description,
        priority: payload.priority || 'medium',
        status: 'open',
        agent_id: agentId || 'unknown'
    };

    if (userId) {
        await createTicketInSupabase(ticket, userId);
        return `[System] Dev Ticket #${ticket.id} created successfully on Server.`;
    } else {
        return `[System] Warning: You are not logged in. Ticket '${ticket.title}' was NOT saved.`;
    }
});

ToolRegistry.register("update_agent_config", "Update configuration for a specific agent.", { agentId: "string", key: "string", value: "any" }, async (payload) => {
    try {
        const { agentId, key, value } = payload;
        if (!agentId || !key) return `[Error] Missing agentId or key.`;
        await db.entities.AgentConfigs.upsert(agentId, key, value);
        await syncAgentsWithDatabase(); // Hot reload
        return `[System] Successfully updated configuration for ${agentId}. Key '${key}' is now set.`;
    } catch (e) {
        return `[Error] Failed to update config: ${e.message}`;
    }
});

ToolRegistry.register("escalate_issue", "Escalate an issue to the reporting manager.", { title: "string", description: "string" }, async (payload, options) => {
    try {
        const { title, description } = payload;
        const agentId = options.agentId;
        const agentConfig = getAgentById(agentId);
        // @ts-ignore
        const managerId = agentConfig?.reportsTo;

        if (!managerId) {
            return `[System] You have no manager to escalate to.`;
        }

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
});

ToolRegistry.register("analyze_failure", "Analyze an error log to find a root cause.", { error_log: "string", context: "string" }, async (payload, options) => {
    try {
        const { error_log, context } = payload;
        if (!error_log) return "[Error] No error log provided for analysis.";

        // 1. Heuristic Analysis (MVP)
        let rootCause = "Unknown";
        let confidence = "Low";
        let suggestion = "Investigate further.";

        const logLower = error_log.toLowerCase();

        if (logLower.includes("rls") || logLower.includes("policy")) {
            rootCause = "Database Permissions (RLS)";
            confidence = "High";
            suggestion = "Check Supabase RLS policies. The agent might be using an ANON key where a SERVICE_ROLE key is required.";
        } else if (logLower.includes("timeout") || logLower.includes("504")) {
            rootCause = "Network/Timeout";
            confidence = "Medium";
            suggestion = "The operation took too long. Optimize the query or increase the timeout.";
        } else if (logLower.includes("syntax") || logLower.includes("unexpected token")) {
            rootCause = "Syntax Error";
            confidence = "High";
            suggestion = "Check the code for syntax errors (missing brackets, invalid JSON).";
        } else if (logLower.includes("not found") || logLower.includes("404")) {
            rootCause = "Resource Missing";
            confidence = "Medium";
            suggestion = "A file or API endpoint is missing. Verify the path.";
        }

        // 2. Future: Semantic Search against Knowledge Base (Incident Reports)
        // const pastIncidents = await db.entities.CompanyKnowledge.search(error_log);

        return JSON.stringify({
            status: "analyzed",
            analysis: {
                root_cause: rootCause,
                confidence: confidence,
                suggestion: suggestion,
                original_error: error_log.slice(0, 200) + "..."
            }
        }, null, 2);

    } catch (e) {
        return `[Error] Failure Analysis failed: ${e.message}`;
    }
});
