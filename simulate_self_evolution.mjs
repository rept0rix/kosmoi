
// Simulation Script for Phase 3: Self-Evolution
// Verifies that agents can be updated dynamically.

import { agents, syncAgentsWithDatabase } from './src/services/agents/AgentRegistry.js';

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};

// Mock global fetch to simulate Supabase response
global.fetch = async (url) => {
    if (url.includes('agent_configs')) {
        console.log(`[MockFetch] Intercepted request to: ${url}`);
        return {
            ok: true,
            json: async () => ([
                {
                    agent_id: 'ceo-agent',
                    key: 'systemPrompt',
                    value: 'You are the EVOLVED CEO. You are now 10x more efficient.'
                }
            ])
        };
    }
    return { ok: true, json: async () => [] };
};

// Mock Supabase Client dependencies if needed
// The AgentRegistry imports db from supabaseClient, which uses fetch.
// So mocking fetch should be enough.

async function runSimulation() {
    console.log("🚀 Starting Self-Evolution Simulation...");

    // 1. Check original state
    const ceo = agents.find(a => a.id === 'ceo-agent');
    console.log("Original CEO Prompt:", ceo.systemPrompt.substring(0, 50) + "...");

    // 2. Run Sync
    console.log("\n🔄 Running Sync...");
    await syncAgentsWithDatabase();

    // 3. Verify update
    console.log("\n✅ Verification:");
    console.log("New CEO Prompt:", ceo.systemPrompt);

    if (ceo.systemPrompt === 'You are the EVOLVED CEO. You are now 10x more efficient.') {
        console.log("SUCCESS: Agent configuration updated dynamically!");
    } else {
        console.error("FAILURE: Agent configuration did not update.");
        process.exit(1);
    }
}

runSimulation();
