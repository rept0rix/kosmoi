
import { agents, syncAgentsWithDatabase, getAgentById } from './src/services/agents/AgentRegistry.js';
import { AgentService } from './src/services/agents/AgentService.js';

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};

// Mock Supabase DB
const mockDb = {
    agent_configs: [],
    AgentConfigs: {
        async list() { return mockDb.agent_configs; },
        async upsert(agentId, key, value) {
            console.log(`[DB] UPSERT: ${agentId}.${key} = "${value.substring(0, 30)}..."`);
            const existing = mockDb.agent_configs.find(c => c.agent_id === agentId && c.key === key);
            if (existing) existing.value = value;
            else mockDb.agent_configs.push({ agent_id: agentId, key, value });
        }
    },
    entities: {
        AgentConfigs: {
            async list() { return mockDb.agent_configs; },
            async upsert(agentId, key, value) {
                // Same as above, just aliased
                return mockDb.AgentConfigs.upsert(agentId, key, value);
            }
        }
    }
};

// Mock Fetch to redirect DB calls to our mockDb
global.fetch = async (url, options) => {
    // 1. Intercept Agent Configs LIST
    if (url.includes('agent_configs') && !options?.method) {
        return { ok: true, json: async () => mockDb.agent_configs };
    }

    // 2. Intercept Agent Configs UPSERT (POST)
    if (url.includes('agent_configs') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        await mockDb.AgentConfigs.upsert(body.agent_id, body.key, body.value);
        return { ok: true, json: async () => ({}) };
    }

    // 3. Intercept Gemini API (The "Brain")
    if (url.includes('generativelanguage.googleapis.com')) {
        const body = JSON.parse(options.body);
        const systemPrompt = body.systemInstruction?.parts?.[0]?.text || "";
        const lastUserMessage = body.contents[body.contents.length - 1].parts[0].text;

        console.log(`\n🤖 [Gemini Mock] Processing request...`);
        console.log(`   Context: ${lastUserMessage.substring(0, 50)}...`);

        // LOGIC: Simulate the "Improve Agent" deciding to update the CEO
        if (systemPrompt.includes("System Architect")) {
            return {
                ok: true,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [{
                                text: `[THOUGHT] The CEO's current prompt is too generic. It lacks specific KPIs. I need to update it to focus on "Revenue" and "Speed".
                                
TOOL: update_agent_config { "agentId": "ceo-agent", "key": "systemPrompt", "value": "You are the GROWTH CEO. Focus ONLY on Revenue and Speed. Do not waste time." }`
                            }]
                        }
                    }]
                })
            };
        }

        return {
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: "I am just a mock response." }] } }]
            })
        };
    }

    return { ok: true, json: async () => [] };
};

// Inject Mock DB into AgentRegistry (since we can't easily mock the module import in ES6 without a loader)
// We rely on the fact that AgentRegistry imports 'db' from supabaseClient, and we can't easily swap that export.
// BUT, we can rely on our `fetch` mock to intercept the calls that `db` makes.

async function runSimulation() {
    console.log("🚀 Starting Retrospective Simulation...");

    // 1. Setup: Define the "Improve Agent"
    const improveAgentConfig = getAgentById('improve-agent');
    const improveAgent = new AgentService(improveAgentConfig);

    // 2. Trigger the "Improvement" logic
    // In the real app, this comes from the 'retrospective.js' workflow.
    // Here we simulate the prompt that the workflow would send.
    const prompt = `
    The CEO Agent has been underperforming. 
    Current Prompt: "You are the CEO..."
    Problem: Too vague.
    Action: Update the CEO's system prompt to be more aggressive on growth.
    `;

    console.log("📣 Sending instruction to Improve Agent...");
    const response = await improveAgent.sendMessage(prompt);

    console.log("\n💬 Improve Agent Response:\n", response.text);

    // 3. Verify the DB was updated
    console.log("\n🔍 Verifying Database State...");
    const ceoConfig = mockDb.agent_configs.find(c => c.agent_id === 'ceo-agent');

    if (ceoConfig && ceoConfig.value.includes("GROWTH CEO")) {
        console.log("✅ SUCCESS: The Improve Agent successfully rewrote the CEO's prompt!");
        console.log("   New Prompt stored in DB:", ceoConfig.value);
    } else {
        console.error("❌ FAILURE: CEO prompt was not updated.");
        console.log("   DB State:", mockDb.agent_configs);
        process.exit(1);
    }
}

runSimulation();
