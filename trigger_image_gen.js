import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
    console.log("--- STARTING IMAGE GEN TRIGGER ---");

    // Dynamic import to ensure env is loaded first
    const { AgentService } = await import('./src/services/agents/AgentService.js');
    const { getAgentById } = await import('./src/services/agents/AgentRegistry.js');

    const designerConfig = getAgentById('graphic-designer-agent');
    if (!designerConfig) {
        console.error("Graphic Designer not found!");
        process.exit(1);
    }

    console.log("Initializing Graphic Designer...");
    const agent = new AgentService(designerConfig, { userId: 'system-trigger-img' });
    await agent.init();

    const mission = `
    [MISSION CRITICAL]
    You are in AUTONOMOUS MODE.
    Your task is to generate a concept image for the "Kosmoi Plus" logo.
    
    INSTRUCTION:
    1. Use the 'nano_banana_api' tool.
    2. Prompt: "futuristic tropical island city logo, neon green and blue, vector art, minimal"
    3. Style: "cyberpunk"
    4. Do NOT ask for clarification. JUST DO IT.
    `;

    console.log("Sending Mission to Graphic Designer...");
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
