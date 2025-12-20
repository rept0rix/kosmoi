import { db, supabase } from "../../api/supabaseClient.js";
import { OPTIMIZER_AGENT } from "@/features/agents/services/registry/OptimizerAgent.js";
import { getAgentReply } from "@/features/agents/services/AgentBrain.js";
import { toolRouter } from "@/features/agents/services/AgentService.js";

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

            // 2. Fetch Real Business Metrics
            const stats = await this.fetchRealMetrics();

            // Format logs for the agent
            const recentLogs = logs && !error ? logs.slice(0, 20).reverse().map(l =>
                `[${l.created_at}] ${l.agent_id}: ${l.prompt.slice(0, 50)}... -> Response: ${l.response.slice(0, 100)}...`
            ).join('\n') : "No recent logs.";

            // 3. Construct Prompt for Optimizer
            const analysisPrompt = `
            Analyze the current System Status.
            
            **Business Metrics (Last 30 Days)**:
            - App Revenue: $${stats.revenue.toFixed(2)}
            - New Signups: ${stats.signups}
            - Conversion Rate: ${stats.conversionRate}
            - Total Traffic (Events): ${stats.totalEvents}
            
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
                return result;
            }

            return "Optimization Cycle Complete. No Action Taken.";

        } catch (err) {
            console.error("Optimizer Loop Error:", err);
            return "Error: " + err.message;
        }
    },

    /**
     * Fetch real business metrics from 'analytics_events'
     */
    async fetchRealMetrics() {
        try {
            // 30 days ago
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // We can't use db.entities.AnalyticsEvents if it's not defined, so valid fallback to raw client
            // Assuming db.from is exposed or we use specific entity methods. 
            // Looking at other files, 'db' usually exports 'entities'. 
            // If 'analytics_events' entity isn't there, we might need raw query.
            // Let's assume we can use the Supabase client directly via db.supabase or similar if needed,
            // but usually we import { supabase } from api/supabaseClient.
            // Wait, looking at imports line 1: import { db } from "../../api/supabaseClient.js";
            // db is likely the wrapping object. let's check if we can query raw or need to import supabase.

            // Re-checking AdminData.jsx, it imports { supabase }.
            // I should stick to that pattern if possible, but I don't want to change imports in this single replace call if I can avoid it.
            // However, db object usually has a `client` or `supabase` property?
            // Let's assume `db.from` works if it's a direct export, OR import supabase.
            // Safe bet: dynamic import or assume `db` has typical methods?
            // Actually, let's look at line 1 again: `import { db } from "../../api/supabaseClient.js";`
            // If db is the default export from supabaseClient it's the client.
            // But usually it's `export const supabase = ...`

            // To be safe and minimal, I'll rely on `db.entities` if possible or try to use `db.client` if I see it.
            // Ah, looking at previous view_file of OptimizerAgent.js: `import { db } from ...`
            // And AdminData.jsx: `import { supabase } from ...`

            // Let's try to grab 'analytics_events' via a direct text replacement that adds the method,
            // and I will assume I can access the table.
            // Wait, `db.entities` usually has generic methods.
            // But for aggregation, custom query is better.

            // I will use `db.client` if it exists, otherwise I might fail.
            // Let's look at `AgentService.js`: `import { db } from ...` and `db.entities.AgentTasks.create`.

            // IMPORTANT: I will assume `import { supabase } from '../../api/supabaseClient.js';` needs to be added or `db` has it.
            // I will add the import in a separate `multi_replace` or just assume `db` proxy works?
            // No, safely, I should probably do a multi-replace to add the import if I want raw 'from'.
            // BUT, I am restricted to `replace_file_content` for single block.
            // I will use `db.client` assuming the wrapper exposes it. If not, I'll fix it.
            // Actually, looking at `AdminOptimizer.jsx`, it imports `OptimizerLoop`.
            // Let's check `OptimizerLoop.js` imports again.
            // Line 1: `import { db } from "../../api/supabaseClient.js";`

            // I'll take a gamble that `db` is the supabase client OR exposes it.
            // If `db.entities` is the pattern, maybe I can't easily aggregate.
            // Let's try `db.client.from` or just `db.from` (if db is the supabase client).

            // Alternate plan: Mock it with 0s if fetch fails, but log error.

            // Let's try to query:
            const { data: events, error } = await supabase.from('analytics_events')
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (error || !events) {
                console.warn("Optimizer: Could not fetch analytics, returning 0s", error);
                return { revenue: 0, signups: 0, conversionRate: "0%", totalEvents: 0 };
            }

            let revenue = 0;
            let signups = 0;
            let totalEvents = events.length;

            events.forEach(e => {
                if (e.event_name === 'purchase') revenue += (e.properties?.value || 0);
                if (e.event_name === 'signup') signups++;
            });

            const conversionRate = totalEvents > 0 ? ((signups / totalEvents) * 100).toFixed(1) + "%" : "0%";

            return { revenue, signups, conversionRate, totalEvents };

        } catch (e) {
            console.error("Optimizer: Metrics fetch failed", e);
            return { revenue: 0, signups: 0, conversionRate: "0%", totalEvents: 0 };
        }
    }
};
