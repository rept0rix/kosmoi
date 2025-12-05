
// Simulation Script for CompanyOS Autonomy (Phase 2)
// This script simulates the BoardOrchestrator logic including Task Management.

console.log("🚀 Starting CompanyOS Autonomous Logic Simulation (Phase 2)...");

// --- MOCKS ---

const mockDb = {
    AgentTasks: {
        list: async () => {
            return [
                { id: 1, title: "Fix Critical Bug", status: "open", priority: "high", assigned_to: "Unassigned" },
                { id: 2, title: "Update Documentation", status: "in_progress", priority: "medium", assigned_to: "tech-lead" }
            ];
        }
    }
};

class MockAgentService {
    constructor(config) {
        this.config = config;
    }
    async sendMessage(prompt) {
        return {
            text: JSON.stringify({
                nextSpeakerId: "product-founder-agent",
                reason: "Mock decision",
                instruction: "Report status."
            })
        };
    }
}

// --- ORCHESTRATOR CODE (Adapted for Simulation) ---

class BoardOrchestrator {
    constructor(availableAgents, options = {}) {
        this.availableAgents = availableAgents;
        this.orchestratorAgent = new MockAgentService({});
        this.options = options;
        // Inject mock DB for simulation
        this.db = mockDb;
    }

    startDailyStandup(companyState = {}) {
        return {
            nextSpeakerId: "ceo-agent",
            reason: "Initiating Daily Standup Routine",
            instruction: "Start the meeting."
        };
    }

    async tick(context = {}) {
        const { companyState, activeMeeting, lastMessageTime } = context;
        const now = Date.now();
        const silenceThreshold = 45000;

        // 1. If NO meeting is active
        if (!activeMeeting) {
            // Check for OPEN tasks using the injected DB
            try {
                const tasks = await this.db.AgentTasks.list();
                const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');

                if (openTasks.length > 0) {
                    const urgentTask = openTasks.find(t => t.priority === 'high') || openTasks[0];

                    if (urgentTask.assigned_to === 'Unassigned') {
                        console.log(`   [Logic] Found unassigned urgent task: ${urgentTask.title}`);
                        return {
                            nextSpeakerId: "ceo-agent",
                            reason: "There are unassigned tasks.",
                            instruction: `Task '${urgentTask.title}' is unassigned. Assign it to a relevant agent.`
                        };
                    }
                }
            } catch (e) {
                console.warn("[Orchestrator] Failed to fetch tasks:", e);
            }

            if (companyState?.status === 'IDLE') {
                return this.startDailyStandup(companyState);
            }
            return null;
        }

        // 2. If meeting IS active, is it stalled?
        if (activeMeeting && lastMessageTime) {
            const timeSinceLastMsg = now - new Date(lastMessageTime).getTime();
            if (timeSinceLastMsg > silenceThreshold) {
                return {
                    nextSpeakerId: "ceo-agent",
                    reason: "The room has been silent for too long.",
                    instruction: "Nudge."
                };
            }
        }

        return null;
    }
}

// --- SIMULATION LOOP ---

async function runSimulation() {
    const agents = [{ id: 'ceo-agent', role: 'CEO' }];
    const orchestrator = new BoardOrchestrator(agents);

    console.log("\n--- SCENARIO 1: Morning (Idle) + Unassigned Task ---");
    // Expectation: Should prioritize the Task over the Standup (or maybe Standup covers it? Logic says Task check is first)
    const state1 = {
        companyState: { status: 'IDLE' },
        activeMeeting: null,
        lastMessageTime: null
    };
    const decision1 = await orchestrator.tick(state1);
    console.log("Decision:", decision1 ? `✅ ${decision1.reason}` : "❌ No Action");

    if (decision1 && decision1.reason.includes("unassigned tasks")) {
        console.log("   -> SUCCESS: Detected unassigned task.");
    } else {
        console.log("   -> FAILURE: Did not detect unassigned task.");
    }

    console.log("\n--- SCENARIO 2: Meeting Stalled ---");
    const state2 = {
        companyState: { status: 'ACTIVE' },
        activeMeeting: { id: 1 },
        lastMessageTime: new Date(Date.now() - 60000).toISOString()
    };
    const decision2 = await orchestrator.tick(state2);
    console.log("Decision:", decision2 ? `✅ ${decision2.reason}` : "❌ Failed");

    console.log("\n--- SIMULATION COMPLETE ---");
}

runSimulation();
