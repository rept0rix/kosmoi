import { db } from "../../api/supabaseClient.js";
import { OPTIMIZER_AGENT } from "../agents/registry/OptimizerAgent.js";
import { getAgentReply } from "../agents/AgentBrain.js";
import { toolRouter } from "../agents/AgentService.js";

export const OptimizerLoop = {
    isRunning: false,
    intervalId: null,

    start(intervalMs = 3600000) { // Default 1 hour
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("🧠 Optimizer Loop Started (Meta-Learning Active)");

        // Initial run
        this.runOptimizationCycle();

        this.intervalId = setInterval(() => {
            this.runOptimizationCycle();
        }, intervalMs);
    },

    stop() {
        this.isRunning = false;
        if (this.intervalId) clearInterval(this.intervalId);
    },

    async runOptimizationCycle() {
        console.log("🧠 Optimizer: analyzing agent performance...");

        try {
            // 1. Fetch Recent Logs (Last 50 interactions)
            const { data: logs, error } = await db.entities.AgentLogs.listLatest(50);
            if (error || !logs || logs.length === 0) return;

            // 2. Heuristic: Find potential "Corrections"
            // Look for user messages following an agent message that contain correction keywords
            // Ideally, we'd feed all logs to the LLM, but to save tokens, we pre-filter.

            // Simplified for V1: We'll just look for explicit user frustration or correction
            // And pass the CONTEXT of that conversation to the Optimizer.

            // For this prototype, let's just feed the last 10 logs to the Optimizer 
            // and ask if it spots any patterns.

            const recentLogs = logs.slice(0, 20).reverse().map(l =>
                `[${l.created_at}] ${l.agent_id}: ${l.prompt.slice(0, 50)}... -> Response: ${l.response.slice(0, 100)}...`
            ).join('\n');

            // 3. Construct Prompt for Optimizer
            const analysisPrompt = `
            Analyze these recent agent logs for performance issues.
            Logs:
            ${recentLogs}
            
            Do you see any repeated failures or patterns where agents are confused?
            If yes, use the 'update_agent_prompt' tool to fix them.
            If everything looks fine, just reply "Status Normal".
            `;

            // 4. Invoke Optimizer Agent
            // Context matches what getAgentReply expects
            const context = {
                meetingTitle: 'Meta-Learning Cycle',
                config: {},
                tasks: []
            };

            // We simulate a message history
            const messages = [{
                agent_id: 'HUMAN_USER',
                role: 'user',
                content: analysisPrompt
            }];

            const reply = await getAgentReply(OPTIMIZER_AGENT, messages, context);

            console.log("🧠 Optimizer Reply:", reply.message);

            // 5. Execute Action if any
            if (reply.action) {
                console.log("🧠 Optimizer deciding to ACT:", reply.action);

                // Execute tool
                const result = await toolRouter(reply.action.name, reply.action.payload, {
                    userId: 'optimizer-system', // System user
                    agentId: OPTIMIZER_AGENT.id,
                    approved: true // Optimizer is trusted (for now)
                });

                console.log("🧠 Optimizer Action Result:", result);
            }

        } catch (err) {
            console.error("Optimizer Loop Error:", err);
        }
    }
};
