import { CRM_SALES_AGENT } from '../src/features/agents/services/registry/CRMSalesAgent.js';
import { AgentRunner } from '../src/features/agents/services/AgentRunner.js';

async function testSalesAgent() {
    console.log("-----------------------------------------");
    console.log("🧪 Testing CRM Sales Agent (Ralph Loop Cycle 3)");
    console.log("-----------------------------------------");

    const mockContext = {
        lead: {
            name: "Yoga Studio Samui",
            business_type: "Yoga",
            location: "Bophut"
        }
    };

    const input = "Draft an outreach email to this lead.";

    try {
        const result = await AgentRunner.run(CRM_SALES_AGENT, input, mockContext);

        console.log("\n✅ Agent Execution Result:");
        console.log("Output:", result.output);
        console.log("Thoughts:", result.thoughtProcess);

        if (result.output.includes("Yoga Studio Samui")) {
            console.log("\n✅ SUCCESS: Email drafted with correct context.");
        } else {
            console.log("\n⚠️ WARNING: Output might be missing context.");
        }

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error);
    }
}

testSalesAgent();
