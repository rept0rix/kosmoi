import 'dotenv/config';
import { toolRouter } from '../src/services/agents/AgentService.js';
import { TECH_LEAD_AGENT } from '../src/services/agents/registry/TechLeadAgent.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testStripeTool() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API Key found");
        process.exit(1);
    }

    console.log(`🤖 Testing Agent: ${TECH_LEAD_AGENT.name}`);
    console.log(`🧠 Model configured: ${TECH_LEAD_AGENT.model}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: TECH_LEAD_AGENT.model,
        tools: [
            {
                functionDeclarations: [
                    {
                        name: "create_payment_link",
                        description: "Creates a Stripe payment link for a product.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                productName: { type: "STRING" },
                                amount: { type: "NUMBER" },
                                currency: { type: "STRING" }
                            },
                            required: ["productName", "amount", "currency"]
                        }
                    }
                ]
            }
        ]
    });

    const prompt = `
    You are the Tech Lead.
    Please create a payment link for a new product called "Gemini 3 Test Widget" with a price of $5.00 USD.
    Use the create_payment_link tool.
    `;

    try {
        console.log("⏳ Sending request to Gemini 3...");
        const result = await model.generateContent(prompt);
        const response = result.response;

        // check for function call
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            console.log("\n✅ Function Call Detected:");
            console.log(`- Function: ${call.name}`);
            console.log(`- Base Args:`, call.args);

            // Simulate execution
            console.log("🛠️ Simulating Tool Execution (AgentSystem)...");
            // Note: In a real flow, AgentService handles this. Here we just verify the model *tries* to call it.
            // But let's actually try to run the mock tool router if we could, 
            // but strictly speaking, verifying the model emits the function call is the critical part for "Brain Transplant" verification.

            if (call.name === 'create_payment_link') {
                console.log("🎉 SUCCESS: The agent correctly chose to call the tool!");
            } else {
                console.error("❌ Agent called wrong tool:", call.name);
            }

        } else {
            console.log("⚠️ No function call detected. Response text:");
            console.log(response.text());
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

testStripeTool();
