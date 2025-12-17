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

            // 2. NEW: Fetch Business Metrics (Mock for now, normally we query analytics_events)
            // We use the same 'stats' structure as AdminData
            const stats = {
                revenue: 12500, // Monthly
                signups: 142,   // This month
                activeUsers: 89,
                conversionRate: "4.2%"
            };

            const recentLogs = logs && !error ? logs.slice(0, 20).reverse().map(l =>
                `[${l.created_at}] ${l.agent_id}: ${l.prompt.slice(0, 50)}... -> Response: ${l.response.slice(0, 100)}...`
            ).join('\n') : "No recent logs.";

            // 3. Construct Prompt for Optimizer
            const analysisPrompt = `
            Analyze the current System Status.
            
            **Business Metrics**:
            - App Revenue: $${stats.revenue}
            - New Signups: ${stats.signups}
            - Conversion Rate: ${stats.conversionRate}
            
            **Recent Agent Logs**:
            ${recentLogs}
            
            **Instructions**:
            1. Check if conversion rate is below 5%. If so, propose a change.
            2. Check if agents are failing (see logs).
            3. Use 'propose_optimization' for business ideas, or 'update_agent_prompt' for fixes.
            4. If status is optimal, reply "Status Normal".
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
