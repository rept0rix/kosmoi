
import { mcpServer } from "../../../services/mcp/index";

async function testRagTool() {
    console.log("🧪 Testing 'search_knowledge_base' tool availability...");

    const toolName = "search_knowledge_base";
    const tools = mcpServer.getToolDefinitions();
    const toolExists = tools.some(t => t.name === toolName);

    if (!toolExists) {
        console.error(`❌ FAIL: Tool '${toolName}' is NOT registered.`);
        process.exit(1);
    }

    console.log(`✅ Tool '${toolName}' found.`);

    // Test execution (Mocking the DB call if necessary, but for now just presence is enough for step 1)
    const response = await mcpServer.executeTool({
        toolName,
        arguments: { query: "best beaches" }
    });

    if (response.error) {
        console.error(`❌ FAIL: Execution returned error: ${response.error}`);
        process.exit(1);
    }

    console.log("✅ Execute success:", response);
}

testRagTool().catch(err => {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
});
