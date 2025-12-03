import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    console.log("--- STARTING AUTONOMOUS TRIGGER ---");

    // Dynamic import to ensure env is loaded first
    const { AgentService } = await import('./src/services/agents/AgentService.js');
    const { getAgentById } = await import('./src/services/agents/AgentRegistry.js');

    const techLeadConfig = getAgentById('tech-lead-agent');
    if (!techLeadConfig) {
        console.error("Tech Lead not found!");
        process.exit(1);
    }

    console.log("Initializing Tech Lead...");
    const agent = new AgentService(techLeadConfig, { userId: 'system-trigger' });
    await agent.init();

    const mission = `
    [MISSION CRITICAL]
    You are in AUTONOMOUS MODE.
    Your task is to create a new React component file IMMEDIATELY.
    
    FILE PATH: src/components/dashboard/SystemHealth.jsx
    CONTENT: A simple card showing "System Status: ONLINE (Autonomous Check)". Use Tailwind colors (green-500).
    
    INSTRUCTION:
    1. Use the 'write_file' tool.
    2. Do NOT ask for clarification.
    3. Do NOT say "I will do it". JUST DO IT.
    `;

    console.log("Sending Mission to Tech Lead...");
    const response = await agent.sendMessage(mission, { simulateTools: true });

    console.log("--- AGENT RESPONSE ---");
    console.log(response.text);

    if (response.toolResult) {
        console.log("--- TOOL RESULT ---");
        console.log(response.toolResult);
    } else {
        console.log("--- NO TOOL EXECUTED ---");
    }
}

run().catch(console.error);
