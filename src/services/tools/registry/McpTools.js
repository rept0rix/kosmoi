import { ToolRegistry } from "../ToolRegistry.js";
import { MCPClient } from "../../../lib/MCPClient.js";

// --- Register MCP Tools ---

ToolRegistry.register("execute_command", async (payload) => {
    // payload: { command }
    return await MCPClient.callTool("execute_command", { command: payload.command });
});

ToolRegistry.register("write_file", async (payload) => {
    // payload: { path, content }
    return await MCPClient.callTool("write_file", { path: payload.path, content: payload.content });
});

ToolRegistry.register("write_code", async (payload) => {
    // Alias for write_file
    return await MCPClient.callTool("write_file", { path: payload.path, content: payload.content });
});

ToolRegistry.register("read_file", async (payload) => {
    // payload: { path }
    // Assuming MCP has read_file or using execute_command cat
    // Optimized: Use execute_command if read_file not explicitly blocked
    // But better to use proper tool if available.
    // Let's assume MCP server has 'read_file' or we shim it.
    // For now, use cat via execute_command as fallback or proper tool?
    // Let's try proper tool 'read_file' first (FileSystem MCP usually has it)
    // If not, we might need to fallback.
    // Let's assume 'read_file' exists on the server side (it does on default filesystem mcp)
    // Wait, the default Filesystem MCP name is 'read_file' usually?
    // Actually, 'read_file' is cleaner.

    // We can just call it 'read_file' and let the proxy route it.
    return await MCPClient.callTool("read_file", { path: payload.path });
});

ToolRegistry.register("browser", async (payload) => {
    // payload: { url }
    const url = payload.url || payload.query;
    if (!url) return "[Error] URL is required.";
    const command = `open "${url}"`; // MacOS specific, but we know environment
    // Use execute_command via MCP
    const result = await MCPClient.callTool("execute_command", { command });
    return `[System] Opening ${url}...\n${result}\n(Please handle Login/CAPTCHA in the new window)`;
});

ToolRegistry.register("linter", async (payload) => {
    const target = payload.path || ".";
    // Run eslint via execute_command
    return await MCPClient.callTool("execute_command", { command: `npx eslint "${target}"` });
});
