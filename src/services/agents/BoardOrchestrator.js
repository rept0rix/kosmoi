import { AgentService } from './AgentService.js';
import { db } from '../../api/supabaseClient.js';

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
- **NO FLUFF**: Do not select an agent just to say "Acknowledged", "I understand", or "Great idea".
- **ACTION OVER SPEECH**: If the previous agent proposed a plan, the NEXT agent must EXECUTE it (if they have the tool) or CRITIQUE it.
- **DIRECT HANDOFF**: If an agent says "I will let the Tech Lead handle this", you MUST select the Tech Lead next.
- **GITHUB DELEGATION**: If the discussion involves creating issues, reviewing PRs, or repository management, you MUST delegate to the 'github-specialist-agent'.
- **ANTI-LOOP**: If the last 3 messages are just agreements, FORCE the next agent to take a concrete step (write code, search, search GitHub, etc.).
`
        }, options);
        this.options = options;
    }

    /**
     * Decides the next step in the conversation.
     * @param {string} goal - The user's main objective.
     * @param {Array} history - The conversation history (messages).
     * @returns {Promise<{
     *   nextSpeakerId: string, 
     *   reason: string, 
     *   instruction: string,
     *   manageTeam?: {
     *     action: 'ADD' | 'REMOVE' | null,
     *     agentId: string,
     *     reason: string
     *   }
     * }>}
     */
    async getNextSpeaker(goal, history, autonomousMode = false, companyState = {}, activeAgentIds = [], activeWorkflowState = null) {
        // 1. CHECK FOR ACTIVE WORKFLOW (MATRIX)
        // Check if there is a strict active workflow step
        if (activeWorkflowState && !activeWorkflowState.isComplete) {
            const currentStep = activeWorkflowState.currentStep;
            console.log(`[Orchestrator] Active Workflow Step: ${activeWorkflowState.workflow.name} -> ${currentStep.label} (${currentStep.role})`);

            // If the last speaker was the CURRENT role, we might want to advance or wait.
            // For this implementation, if the current role just spoke, we assume they are done and we should advance (or waiting for user input).
            // BUT, the `WorkflowService` must be advanced by the main app logic (e.g., in `useBoardRoom.js` after a message).
            // Here, we just ENFORCE that the next speaker is the one defined in the step.

            return {
                nextSpeakerId: currentStep.role,
                reason: `Strict Workflow Enforcement: ${activeWorkflowState.workflow.name} (Step ${activeWorkflowState.progress}%) requires ${currentStep.role} to act.`,
                instruction: `You are performing the '${currentStep.label}' step of the '${activeWorkflowState.workflow.name}' workflow. Focus ONLY on this task.`
            };
        }

        // Legacy Documentation Workflow Hack (Optional: Remove if fully replaced by generic above)
        const isDocWorkflow = goal.toLowerCase().includes("documentation");
        if (isDocWorkflow && !activeWorkflowState) {
            const { WORKFLOWS } = await import('./workflows.js');
            // ... legacy logic ...
        }

        // 2. FALLBACK TO LLM ORCHESTRATION (Existing Logic)
        const formattedHistory = history.map(msg => {
            const speaker = msg.role === 'user' ? 'User' : (msg.agentId || 'Unknown Agent');
            return `${speaker}: ${msg.content}`;
        }).join('\n');

        const prompt = `
CURRENT GOAL: "${goal}"

COMPANY STATE (NEWS & KPIs):
COMPANY STATE (NEWS & KPIs):
${JSON.stringify(companyState || {}, null, 2)}

PRESENT AGENTS (IN THE ROOM):
${activeAgentIds.length > 0 ? activeAgentIds.join(', ') : "Everyone is available"}

CONVERSATION HISTORY:
${formattedHistory}

INSTRUCTIONS:
- Review the last message in the history.
- If the last speaker successfully completed their task (e.g., "File saved", "Done"), DO NOT select them again.
- Select the NEXT logical agent in the workflow.
- If the goal is fully achieved by all agents:
    - If AUTONOMOUS MODE is ON: Select "vision-founder-agent" and instruct them to "Conduct a Strategic Review based on the COMPANY STATE."
    - If AUTONOMOUS MODE is OFF: Output "TERMINATE".

ANTI-LOOP & EFFICIENCY RULES (CRITICAL):
- **ABSOLUTELY NO "THANK YOU" LOOPS**: If an agent just said "Done" or "Understood", the next agent MUST NOT say "Great" or "Thanks". They must move to the NEXT STEP of the goal.
- **FORCED PROGRESS**: If the conversation feels stuck, select the 'ceo-agent' or 'board-chairman' to give a direct order.
- **VERIFICATION**: If code was written, the next step is usually to 'test-agent' or 'tech-lead-agent' to verify it.
- **SILENCE IS BETTER THAN NOISE**: If the goal is met, just output "TERMINATE". Don't force a "Goodbye".

TEAM MANAGEMENT (CHIEF OF STAFF MODE):
- You are the "Chief of Staff". You decide who is in the room.
- **CRITICAL**: The user has selected the current agents (${activeAgentIds.length}). DO NOT add new agents unless:
  1. The user EXPLICITLY asks for them (e.g., "Where is the Tech Lead?").
  2. The current goal is IMPOSSIBLE to achieve without them.
- If you can make do with the current team, DO NOT change it.
- If you must add someone, provide a very strong reason.

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
                try {
                    const cleanText = jsonMatch[0]
                        .replace(/```json/g, '')
                        .replace(/```/g, '')
                        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
                        .trim();
                    const decision = JSON.parse(cleanText);
                    return decision;
                } catch (e) {
                    console.error("JSON Parse Error in Orchestrator:", e);
                    console.log("Raw Text:", text);
                    // Fallback: Try to repair common JSON errors or just return default
                    return {
                        nextSpeakerId: this.availableAgents[0].id,
                        reason: "Orchestrator JSON was malformed. Defaulting to first agent.",
                        instruction: "Continue the discussion."
                    };
                }
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
    /**
     * Forces the CEO to start a Daily Standup meeting.
     * @param {Object} companyState - The current state of the company (budget, missions, etc).
     * @returns {Object} A decision object for the CEO to speak next.
     */
    startDailyStandup(companyState = {}) {
        const budget = companyState.budget || 0;
        const activeMissions = companyState.active_missions ? companyState.active_missions.length : 0;

        return {
            nextSpeakerId: "ceo-agent",
            reason: "Initiating Daily Standup Routine",
            instruction: `
[DAILY STANDUP PROTOCOL]
Good morning team.
Current Status:
- Budget: $${budget}
- Active Missions: ${activeMissions}

OBJECTIVE: We need to generate revenue and ship features.
1. Ask the 'product-founder-agent' for the status of the roadmap.
2. Ask the 'tech-lead-agent' if the system is stable.
3. Decide on ONE key objective for today.

Start the meeting now. Be authoritative.
`
        };
    }
    /**
     * The Heartbeat Tick.
     * Called periodically by the CompanyHeartbeat service.
     * Checks for stalled states or opportunities to work.
     * 
     * @param {Object} context - { companyState, activeMeeting, lastMessageTime }
     * @returns {Promise<Object|null>} Decision object or null if no action needed.
     */
    async tick(context = {}) {
        const { companyState, activeMeeting, lastMessageTime } = context;
        const now = Date.now();
        const silenceThreshold = 45000; // 45 seconds of silence = stalled

        console.log("[Orchestrator] Tick...", context);

        // 1. If NO meeting is active, should we start one OR assign work?
        if (!activeMeeting) {
            // Check for OPEN tasks
            try {
                const tasks = await db.entities.AgentTasks.list(); // Fetch all tasks (ordered by created_at desc)
                const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');

                if (openTasks.length > 0) {
                    // Find a task that needs attention
                    const urgentTask = openTasks.find(t => t.priority === 'high') || openTasks[0];

                    // If it's unassigned, assign it
                    if (urgentTask.assigned_to === 'Unassigned') {
                        // For MVP, assign to Tech Lead or Product based on title?
                        // Let's just pick Tech Lead for now or ask CEO to assign.
                        return {
                            nextSpeakerId: "ceo-agent",
                            reason: "There are unassigned tasks.",
                            instruction: `Task '${urgentTask.title}' is unassigned. Assign it to a relevant agent.`
                        };
                    }

                    // If it's assigned, nudge the assignee if they haven't updated it recently?
                    // (Skip for MVP complexity, just focus on unassigned or starting work)
                }
            } catch (e) {
                console.warn("[Orchestrator] Failed to fetch tasks:", e);
            }

            // If it's "Morning" (mocked) or we are IDLE, start a standup.
            // For MVP, if we are completely idle, suggest a standup.
            if (companyState?.status === 'IDLE') {
                return this.startDailyStandup(companyState);
            }
            return null;
        }

        // 2. If meeting IS active, is it stalled?
        if (activeMeeting && lastMessageTime) {
            const timeSinceLastMsg = now - new Date(lastMessageTime).getTime();
            if (timeSinceLastMsg > silenceThreshold) {
                console.log(`[Orchestrator] Meeting stalled for ${timeSinceLastMsg}ms. Nudging...`);

                // Force a nudge
                return {
                    nextSpeakerId: "ceo-agent", // CEO breaks the silence
                    reason: "The room has been silent for too long.",
                    instruction: "Ask the team for a status update or propose the next step. Don't let the momentum die."
                };
            }
        }

        return null;
    }
}
