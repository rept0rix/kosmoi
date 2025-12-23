
import '../src/services/tools/registry/WorkflowTools.js';
import { ToolRegistry } from '../src/services/tools/ToolRegistry.js';

async function test() {
    console.log("📂 Testing Workflow Tools...");

    // 1. List Workflows
    console.log("\n--- Testing list_workflows ---");
    const listResult = await ToolRegistry.execute('list_workflows');
    console.log(listResult);

    if (listResult.includes("Error")) {
        console.error("❌ list_workflows failed");
        process.exit(1);
    }

    // Extract a workflow name to test get_workflow
    // Output format: "Available Workflows ...:\nworkflow.json\n..."
    const lines = listResult.split('\n');
    let testWorkflow = null;
    for (const line of lines) {
        if (line.endsWith('.json')) {
            testWorkflow = line.trim();
            break;
        }
    }

    if (!testWorkflow) {
        console.warn("⚠️ No workflows found to test 'get_workflow'.");
        return;
    }

    // 2. Get Workflow Content
    console.log(`\n--- Testing get_workflow for: ${testWorkflow} ---`);
    const contentResult = await ToolRegistry.execute('get_workflow', { name: testWorkflow });

    if (contentResult.startsWith("Error") || !contentResult.trim().startsWith('{')) {
        console.error("❌ get_workflow failed or returned invalid JSON");
        console.error(contentResult.substring(0, 200));
        process.exit(1);
    } else {
        console.log("✅ get_workflow returned content successfully.");
        console.log("Snippet:", contentResult.substring(0, 100).replace(/\n/g, ' '));
    }

    console.log("\n🎉 Workflow Tools Verification Passed!");
}

test();
