import { db } from "../../api/supabaseClient.js";
import { CompanyKnowledge } from "../../features/agents/services/CompanyKnowledge.js";

export const DailyStandupService = {
    /**
     * Gather data and generate the Morning Report prompt for the CEO.
     * @param {string} userId
     */
    async generateMorningReport(userId) {
        console.log("Generating Morning Report for:", userId);

        // 1. Fetch Key Metrics
        const { data: tasks } = await db.entities.AgentTasks.select('status, priority, title').eq('status', 'open').limit(10);
        // Mock revenue/users for now until we have real analytics
        const revenue = "$1,250 (Simulated)";
        const activeUsers = "42";

        // 2a. Fetch Master Backlog (Simulated Source of Truth)
        let backlogItems = [];
        try {
            // In a real app, this might be a DB query or file read via API
            // Here we import it statically just for the simulation concept, 
            // but dynamic import is better to avoid caching issues if we were writing to it.
            const { default: masterBacklog } = await import('../../data/master_backlog.json', { assert: { type: 'json' } });
            backlogItems = masterBacklog.filter(item => item.status === 'todo');
        } catch (e) {
            console.warn("Could not load master backlog:", e);
        }

        const backlogSummary = backlogItems.length
            ? backlogItems.map(i => `- [${i.priority.toUpperCase()}] ${i.title}: ${i.description}`).join('\n')
            : "Backlog is empty.";


        // 3. Construct the Prompt
        const insights = []; // Placeholder until real insights logic is connected
        const taskSummary = tasks?.length ? tasks.map(t => `- [${t.priority}] ${t.title}`).join('\n') : "No open tasks.";
        const insightSummary = insights?.length ? insights.map(i => `- [${i.category}] ${i.content}`).join('\n') : "No new insights.";

        const prompt = `
🚨 **DAILY STANDUP** 🚨
Good Morning, CEO. Here is the **System Status Report**:

📊 **Metrics**:
- Open Tasks: ${tasks?.length || 0}
- Revenue (YTD): ${revenue}
- Active Users: ${activeUsers}

📋 **Master Backlog (Pending Strategic Items)**:
${backlogSummary}

📝 **Current Active Tasks**:
${taskSummary}

💡 **Recent Insights**:
${insightSummary}

**YOUR MISSION**:
1. Review the Master Backlog.
2. Select high-priority items to move to ACTIVE status.
3. **Assign them** to the team (Tech Lead, GitHub Specialist, Product) using 'create_task'.
4. If a task requires GitHub work (e.g. "Implement GitHub Integration"), assign it to the 'tech-lead-agent' with explicit instruction to delegate to 'github-specialist-agent'.
5. Be authoritative.
        `.trim();

        return prompt;
    }
};
