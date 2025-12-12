import { ToolRegistry } from "../ToolRegistry.js";
import { db } from "../../../api/supabaseClient.js";
import { createTicketInSupabase } from "../../agents/memorySupabase.js";
import { syncAgentsWithDatabase, getAgentById } from "../../agents/AgentRegistry.js";

ToolRegistry.register("create_task", async (payload, options) => {
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
});

ToolRegistry.register("update_task_status", async (payload, options) => {
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

ToolRegistry.register("dev_ticket", async (payload, options) => {
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

ToolRegistry.register("update_agent_config", async (payload) => {
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

ToolRegistry.register("escalate_issue", async (payload, options) => {
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
