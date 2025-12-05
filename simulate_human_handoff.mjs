
import { agents, getAgentById } from './src/services/agents/AgentRegistry.js';
import { AgentService } from './src/services/agents/AgentService.js';

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};

// Mock WebSocket for MCP
global.WebSocket = class MockWebSocket {
    constructor(url) {
        console.log(`[MockWS] Connecting to ${url}...`);
        setTimeout(() => {
            this.onopen();
            // Simulate successful open command execution
            this.onmessage({
                data: JSON.stringify({ id: 1, result: {} })
            });
            setTimeout(() => {
                this.onmessage({
                    data: JSON.stringify({ id: 3, result: { content: [{ text: "Opened successfully" }] } })
                });
            }, 100);
        }, 100);
    }
    send(data) {
        const parsed = JSON.parse(data);
        console.log(`[MockWS] Sending: ${parsed.method}`, parsed.params || "");
    }
    close() { }
};

// Mock Fetch
global.fetch = async (url) => {
    return { ok: true, json: async () => ({}) };
};

async function runSimulation() {
    console.log("🚀 Starting Human Handoff Simulation...");

    // 1. Setup Agent
    const agentConfig = getAgentById('growth-agent');
    const agent = new AgentService(agentConfig);

    // 2. Simulate Agent needing a key and opening browser
    // We bypass the LLM for this test and call the tool directly via the router logic
    // But AgentService.sendMessage calls the LLM.
    // Let's mock the LLM response to force a tool call.

    agent.callGemini = async () => {
        return {
            text: "I need a Resend API Key to proceed. Opening the signup page for you.",
            toolRequest: {
                name: "browser",
                payload: { url: "https://resend.com/signup" }
            }
        };
    };

    console.log("📣 Agent is requesting action...");
    const response = await agent.sendMessage("Start the email campaign.");

    console.log("\n💬 Agent Response:", response.text);

    if (response.toolResult && response.toolResult.includes("Opened https://resend.com/signup")) {
        console.log("✅ SUCCESS: Agent successfully triggered the browser tool!");
        console.log("   User would now see the signup page.");
    } else {
        // The mock WS returns a generic success message, let's check if toolResult contains it
        console.log("   Tool Result:", response.toolResult);
        if (response.toolResult.includes("Opened")) {
            console.log("✅ SUCCESS: Browser tool executed.");
        } else {
            console.error("❌ FAILURE: Browser tool did not execute as expected.");
        }
    }
}

runSimulation();
