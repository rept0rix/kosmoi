
import { StripeService } from '../src/services/StripeService.js';
import { toolRouter } from '../src/services/agents/AgentService.js';
import { agents } from '../src/services/agents/AgentRegistry.js';

async function verifyOneDollarChallenge() {
    console.log("🚀 Starting One Dollar Challenge Verification...");

    // 1. Direct Service Test
    console.log("\nTesting StripeService directly...");
    const link = await StripeService.createPaymentLink("MyBusiness", "Test Product", 99, "usd");
    console.log("Generated Link:", link);

    if (link.url.includes("Test%20Product") && link.amount === 99) {
        console.log("✅ StripeService verification passed!");
    } else {
        console.error("❌ StripeService verification failed!");
        process.exit(1);
    }

    // 2. Tool Router Test (Simulating Agent)
    console.log("\nTesting Agent Tool Execution...");
    try {
        // Mocking options for toolRouter
        const options = {
            userId: '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e', // Dev ID
            agentId: 'tech-lead-agent',
            approved: true // Simulate approval
        };

        const result = await toolRouter("create_payment_link", {
            productName: "Mega Widget",
            amount: 1,
            currency: "usd",
            businessName: "Autonomous LLC"
        }, options);

        console.log("Tool Result:", result);

        if (result.status === 'active' && result.amount === 1) {
            console.log("✅ Tool Router verification passed!");
        } else {
            console.error("❌ Tool Router verification failed!");
        }

    } catch (e) {
        console.error("❌ Tool Router verification error:", e);
    }
}

verifyOneDollarChallenge();
