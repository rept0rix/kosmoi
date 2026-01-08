import { ToolRegistry } from "./ToolRegistry.js";

/**
 * AgentRunner
 * Executes an agent's logic, handles prompt construction, and invokes tools.
 */
export const AgentRunner = {
    /**
     * Run an agent for a specific task.
     * @param {Object} agent - The agent configuration object.
     * @param {string} input - The user input or trigger message.
     * @param {Object} context - Additional data (e.g., current lead, weather).
     */
    run: async (agent, input, context = {}) => {
        console.log(`[AgentRunner] Running ${agent.id}...`);

        // 1. Construct Prompt
        const systemPrompt = agent.systemPrompt;

        // 2. Mock Logic (Since we don't have a real ReAct loop yet)
        // In a real implementation, we would call the LLM here with tools defined.
        // For Cycle 3 MVP, we will simulate the LLM 'deciding' to use a tool.

        console.log(`[AgentRunner] ${agent.name} is thinking...`);

        // SIMULATION: If input contains "email", try to generate an email
        if (input.toLowerCase().includes("email") && agent.allowedTools.includes("generate_email")) {
            console.log(`[AgentRunner] Agent decided to use tool: generate_email`);

            // 2.1 Pre-tool: Search Knowledge Logic (Simulated)
            if (agent.allowedTools.includes("search_knowledge_base")) {
                const searchResult = await ToolRegistry.search_knowledge_base("Yoga in Samui");
                context.knowledge = searchResult;
            }

            // 2.2 Call Tool
            const draft = await ToolRegistry.generate_email({ topic: "Partnership" }, context);

            // 2.3 Post-tool: Log interaction
            if (agent.allowedTools.includes("insert_interaction")) {
                await ToolRegistry.insert_interaction({ type: "email_draft", content: draft });
            }

            return {
                output: draft,
                thoughtProcess: ["Searched knowledge base", "Drafted email based on template", "Logged interaction"]
            };
        }

        return {
            output: `I received your input: "${input}". (Agent logic not fully implemented yet)`,
            thoughtProcess: []
        };
    }
};
