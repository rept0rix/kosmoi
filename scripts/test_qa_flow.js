
import { BoardOrchestrator } from '../src/services/agents/BoardOrchestrator.js';
import { QA_SPECIALIST_AGENT } from '../src/services/agents/registry/QASpecialist.js';

// Mock agents
const mockAgents = [
    { id: 'tech-lead-agent', role: 'Tech Lead', systemPrompt: '...' },
    QA_SPECIALIST_AGENT
];

async function testErrorHandling() {
    console.log("Starting TestOps Integration Test...");

    // Mock Orchestrator (we don't want to call real LLM for the test, 
    // but we want to test the manual error interception logic)
    const orchestrator = new BoardOrchestrator(mockAgents);

    // Simulate History with an Error
    const history = [
        { role: 'user', content: 'Deploy the worker.' },
        { agentId: 'tech-lead-agent', role: 'assistant', content: '[Error] Failed to deploy: SyntaxError: Unexpected token' }
    ];

    const goal = "Deploy system";

    // Call getNextSpeaker
    // Note: The LLM call inside getNextSpeaker might fail if we don't mock it, 
    // BUT our error logic happens BEFORE the LLM call. So it should return immediately.

    try {
        const decision = await orchestrator.getNextSpeaker(goal, history);

        console.log("Decision:", decision);

        if (decision.nextSpeakerId === 'qa-specialist-agent') {
            console.log("✅ PASS: Orchestrator correctly selected QA Specialist on error.");
        } else {
            console.error("❌ FAIL: Orchestrator did NOT select QA Specialist.");
        }

    } catch (e) {
        console.error("Test failed with exception:", e);
    }
}

testErrorHandling();
