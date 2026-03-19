import { db } from "../../../api/supabaseClient.js";

// Import agents by category — organized hierarchy
import * as Strategic from "./registry/strategic/index.js";
import * as Execution from "./registry/execution/index.js";
import * as Specialist from "./registry/specialist/index.js";
import * as Infrastructure from "./registry/infrastructure/index.js";
import * as Intelligence from "./registry/intelligence/index.js";

/**
 * Agents organized by category (BMAD framework).
 * Use this for UI rendering, capability filtering, and agent selection.
 */
export const agentsByCategory = {
    strategic: Object.values(Strategic),
    execution: Object.values(Execution),
    specialist: Object.values(Specialist),
    infrastructure: Object.values(Infrastructure),
    intelligence: Object.values(Intelligence),
};

/**
 * Flat array of all agents — kept for backward compatibility.
 * Prefer agentsByCategory for new code.
 */
export const agents = [
    ...agentsByCategory.strategic,
    ...agentsByCategory.execution,
    ...agentsByCategory.specialist,
    ...agentsByCategory.infrastructure,
    ...agentsByCategory.intelligence,
];

// Helper to get agent by ID
export const getAgentById = (id) => {
    return agents.find(agent => agent.id === id);
};

// Sync agents with database (System Prompts)
export const syncAgentsWithDatabase = async () => {
    console.log("Syncing agents with database...");

    try {
        const updates = agents.map(agent => ({
            id: agent.id,
            name: agent.name || agent.role, // Fallback if name missing
            role: agent.role,
            system_prompt: agent.systemPrompt,
            icon: agent.icon,
            metadata: {
                layer: agent.layer,
                model: agent.model,
                tools: agent.allowedTools
            }
        }));

        // Upsert logic would go here if we were writing to DB
        // For now we just update the specific table we know about
        for (const agent of agents) {
            const { error } = await db.entities.AgentConfigs.upsert({
                agent_id: agent.id,
                system_prompt: agent.systemPrompt
            });

            if (error) console.error(`Failed to sync agent ${agent.id}:`, error);
        }
        console.log("Agent sync complete.");
    } catch (err) {
        console.error("Error syncing agents:", err);
    }
};

// Load dynamic prompts from database (The Plastic Brain)
export const loadDynamicPrompts = async () => {
    console.log("Loading dynamic prompts from database...");
    try {
        const { data, error } = await db.entities.AgentConfigs.select('*');
        if (error) throw error;

        let updateCount = 0;
        if (data) {
            data.forEach(config => {
                const agent = agents.find(a => a.id === config.agent_id);
                if (agent && config.system_prompt) {
                    // OVERRIDE: Update the in-memory agent object
                    if (agent.systemPrompt !== config.system_prompt) {
                        agent.systemPrompt = config.system_prompt;
                        console.log(`🧠 Neuro-Plasticity: Updated prompt for ${agent.name}`);
                        updateCount++;
                    }
                }
            });
        }
        console.log(`Dynamic prompt loading complete. ${updateCount} agents updated.`);
        return updateCount;
    } catch (err) {
        console.error("Error loading dynamic prompts:", err);
        return 0;
    }
};

/**
 * Groups agents by their 'layer' property.
 * @returns {Record<string, Array>}
 */
export const groupAgentsByLayer = () => {
    return agents.reduce((acc, agent) => {
        const layer = agent.layer || 'Other';
        if (!acc[layer]) {
            acc[layer] = [];
        }
        acc[layer].push(agent);
        return acc;
    }, {});
};
