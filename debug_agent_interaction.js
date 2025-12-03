import 'dotenv/config';
import { AgentService } from './src/services/agents/AgentService.js';
import { agents } from './src/services/agents/AgentRegistry.js';

// Mock localStorage for Node environment
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};

async function testInteraction() {
    const visionAgent = agents.find(a => a.id === 'vision-founder-agent');
    if (!visionAgent) {
        console.error("Vision Agent not found");
        return;
    }

    console.log("Initializing Vision Agent...");
    const service = new AgentService(visionAgent, { userId: 'test-user' });
    await service.init();

    const context = `[Board Meeting - Turn 1/3]
User Context: "We need a plan to launch the MVP next month. Who does what?"

Recent History:
User: We need a plan to launch the MVP next month. Who does what?

Current Speaker: vision-founder-agent
Instructions: 
- Respond to the User and other Agents.
- If you see a [TASK] defined by others, validate or refine it.
- If you see a [CALL], acknowledge it.
- Output your response now.`;

    console.log("Sending message to Vision Agent...");
    try {
        const response = await service.sendMessage(context, { simulateTools: true });
        console.log("Response received:");
        console.log(response.text);
    } catch (error) {
        console.error("Error calling agent:", error);
    }
}

testInteraction();
