
import { getAgentById } from "../AgentRegistry.js";
import { AgentService } from "../AgentService.js";

/**
 * Runs a retrospective session where agents analyze and improve themselves.
 */
export async function runRetrospective(userId) {
    console.log("🔄 Starting Retrospective Workflow...");

    // 1. Initialize Key Agents
    const orchestrator = new AgentService(getAgentById('board-chairman'), { userId });
    const observer = new AgentService(getAgentById('observe-agent'), { userId });
    const improver = new AgentService(getAgentById('improve-agent'), { userId });

    // 2. Observer gathers data (Simulated for now, or real logs if available)
    // In a real scenario, Observer would query 'app_logs' or 'agent_tasks'
    const observationPrompt = `
    Analyze the recent performance of the team.
    Focus on:
    1. Did the CEO provide clear instructions?
    2. Did the Tech Lead write high-quality code?
    
    Output a brief "Performance Report".
    `;
    const observation = await observer.sendMessage(observationPrompt);
    console.log("\n📋 Observer Report:", observation.text);

    // 3. Improver analyzes and acts
    const improvementPrompt = `
    Based on this report:
    "${observation.text}"

    Your goal is to IMPROVE the system.
    If the CEO was vague, update their system prompt to be more specific.
    If the Tech Lead was buggy, update their prompt to focus on testing.

    USE THE TOOL 'update_agent_config' to apply changes immediately.
    `;

    console.log("\n🛠️ Improver is analyzing...");
    const improvement = await improver.sendMessage(improvementPrompt, { simulateTools: true });

    console.log("\n✅ Retrospective Complete.");
    return improvement.text;
}
