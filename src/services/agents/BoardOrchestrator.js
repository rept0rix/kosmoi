import { AgentService } from './AgentService';

/**
 * The BoardOrchestrator acts as the "Chairman" of the board.
 * It decides which agent should speak next based on the conversation history and the current goal.
 */
export class BoardOrchestrator {
    constructor(availableAgents, options = {}) {
        this.availableAgents = availableAgents;
        this.orchestratorAgent = new AgentService({
            id: 'board-chairman',
            role: 'Chairman',
            model: 'gemini-2.0-flash',
            systemPrompt: `You are the Chairman of the Board for "Kosmoi".
Your job is to orchestrate a discussion between various AI agents to achieve a specific GOAL.

You have the following agents available:
${availableAgents.map(a => `- ${a.role} (ID: ${a.id}): ${a.systemPrompt.slice(0, 100)}...`).join('\n')}

INSTRUCTIONS:
1. Analyze the current conversation history.
2. Determine if the GOAL has been met.
3. If the goal is met, output "TERMINATE".
4. If the goal is NOT met, decide which agent is BEST SUITED to speak next.
5. You must output a JSON object with the following structure:
{
  "nextSpeakerId": "agent-id" | "TERMINATE",
  "reason": "Brief explanation of why this agent is needed next.",
  "instruction": "Specific instruction for the agent on what to focus on."
}

RULES:
- Do not select the same agent twice in a row unless absolutely necessary.
- Keep the conversation moving towards the goal.
- If an agent asks a question, select the agent best equipped to answer it.
- If an agent proposes a plan, select an executive to approve it.
`
        }, options);
    }

    /**
     * Decides the next step in the conversation.
     * @param {string} goal - The user's main objective.
     * @param {Array} history - The conversation history (messages).
     * @returns {Promise<{nextSpeakerId: string, reason: string, instruction: string}>}
     */
    async getNextSpeaker(goal, history, autonomousMode = false, companyState = {}) {
        // 1. CHECK FOR ACTIVE WORKFLOW (MATRIX)
        // For this MVP, we assume the "documentation_package" workflow if the goal mentions "documentation".
        // In a real app, we'd select the workflow based on intent classification.
        const isDocWorkflow = goal.toLowerCase().includes("documentation");

        if (isDocWorkflow) {
            const { WORKFLOWS } = await import('./workflows.js');
            const workflow = WORKFLOWS.documentation_package;

            // Check progress
            const fs = JSON.parse(localStorage.getItem('agent_filesystem') || '{}');

            for (const step of workflow.steps) {
                // If the expected file for this step DOES NOT exist, this is the current step.
                if (step.expectedFile && !fs[step.expectedFile] && !Object.keys(fs).some(k => k.startsWith(step.expectedFile.replace('/', '')))) {
                    console.log(`[Orchestrator] Workflow Step Active: ${step.id} (${step.agentId})`);
                    return {
                        nextSpeakerId: step.agentId,
                        reason: `Executing workflow step: ${step.id}. Waiting for file: ${step.expectedFile}`,
                        instruction: step.instruction
                    };
                }
            }

            // If all steps passed
            return {
                nextSpeakerId: "TERMINATE",
                reason: "All workflow steps completed successfully.",
                instruction: "The documentation package is complete."
            };
        }

        // 2. FALLBACK TO LLM ORCHESTRATION (Existing Logic)
        const formattedHistory = history.map(msg => {
            const speaker = msg.role === 'user' ? 'User' : (msg.agentId || 'Unknown Agent');
            return `${speaker}: ${msg.content}`;
        }).join('\n');

        const prompt = `
CURRENT GOAL: "${goal}"

COMPANY STATE (NEWS & KPIs):
${JSON.stringify(companyState || {}, null, 2)}

CONVERSATION HISTORY:
${formattedHistory}

INSTRUCTIONS:
- Review the last message in the history.
- If the last speaker successfully completed their task (e.g., "File saved", "Done"), DO NOT select them again.
- Select the NEXT logical agent in the workflow.
- If the goal is fully achieved by all agents:
    - If AUTONOMOUS MODE is ON: Select "vision-founder-agent" and instruct them to "Conduct a Strategic Review based on the COMPANY STATE."
    - If AUTONOMOUS MODE is OFF: Output "TERMINATE".

TEAM MANAGEMENT (CHIEF OF STAFF MODE):
- You are the "Chief of Staff". You decide who is in the room.
- If the current goal requires a skill that is MISSING from the "Active Agents" list (e.g., need code but Tech Lead is missing), output a "manageTeam" action to "ADD" them.
- If an agent is present but irrelevant/distracting, output a "manageTeam" action to "REMOVE" them.
- Only change the team if necessary.

Based on the above, who should speak next?
Output JSON format:
{
  "nextSpeakerId": "agent-id" | "TERMINATE",
  "reason": "Why you selected them",
  "instruction": "Specific instruction for the agent",
  "manageTeam": {
      "action": "ADD" | "REMOVE" | null,
      "agentId": "agent-id-to-add-or-remove",
      "reason": "Why you are changing the team"
  }
}
`;

        try {
            const response = await this.orchestratorAgent.sendMessage(prompt, { simulateTools: false });
            const text = response.text;

            // Clean up markdown code blocks if present
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const cleanText = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
                const decision = JSON.parse(cleanText);
                return decision;
            } else {
                console.warn("Orchestrator did not return JSON. Fallback to first agent.");
                return {
                    nextSpeakerId: this.availableAgents[0].id,
                    reason: "Orchestrator failed to parse JSON.",
                    instruction: "Please continue the discussion."
                };
            }
        } catch (error) {
            console.error("Orchestrator Error:", error);
            return {
                nextSpeakerId: null,
                reason: "Error in orchestration.",
                instruction: ""
            };
        }
    }
}
