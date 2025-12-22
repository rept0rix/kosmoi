import { ToolRegistry } from "../ToolRegistry.js";
import { db } from "../../../api/supabaseClient.js";
import { agents } from "../../../features/agents/services/AgentRegistry.js";

/**
 * Update Agent Prompt (Plasticity Tool)
 * Allows the Optimizer to rewrite an agent's system prompt.
 */
ToolRegistry.register("update_agent_prompt", async ({ agentId, addedRule }, { agentId: callerId }) => {
    if (callerId !== 'optimizer-agent' && callerId !== 'human-user') {
        throw new Error("Only the Optimizer or Admin can rewrite neural pathways.");
    }

    if (!agentId || !addedRule) throw new Error("Missing agentId or addedRule");

    // 1. Get current prompt from DB or Registry
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    let currentPrompt = agent.systemPrompt;

    // Check DB for existing override
    const { data: config } = await db.entities.AgentConfigs.select('system_prompt').eq('agent_id', agentId).single();
    if (config) {
        currentPrompt = config.system_prompt;
    }

    // 2. Append the new rule
    const newPrompt = `${currentPrompt}\n\n[OPTIMIZED RULE]: ${addedRule}`;

    // 3. Save to DB
    const { error } = await db.entities.AgentConfigs.upsert({
        agent_id: agentId,
        system_prompt: newPrompt
    });

    if (error) throw error;

    // 4. Update in-memory (Hot Reload)
    agent.systemPrompt = newPrompt;

    return `Successfully updated prompt for ${agent.name}. Added rule: "${addedRule}"`;
});

/**
 * Read Agent Logs
 * Allows the Optimizer to analyze recent performance.
 */
ToolRegistry.register("read_agent_logs", async ({ agentId, limit = 20 }) => {
    const { data, error } = await db.entities.AgentLogs.listLatest(limit);
    if (error) throw error;

    // Filter if specific agent requested
    const logs = agentId ? data.filter(l => l.agent_id === agentId) : data;

    return JSON.stringify(logs.map(l => ({
        agent: l.agent_id,
        prompt: l.prompt.slice(0, 200), // Summary
        response: l.response.slice(0, 200), // Summary
        timestamp: l.created_at
    })));
});
