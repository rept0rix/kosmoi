import { ToolRegistry } from "../ToolRegistry.js";
import { MCPClient } from "../../../shared/lib/MCPClient.js";

// --- Register MCP Tools ---

ToolRegistry.register("execute_command", "Execute a shell command on the host machine.", { command: "string" }, async (payload) => {
    // payload: { command }
    return await MCPClient.callTool("execute_command", { command: payload.command });
});

ToolRegistry.register("write_file", "Write content to a file at a specific path.", { path: "string", content: "string" }, async (payload) => {
    // payload: { path, content }
    return await MCPClient.callTool("write_file", { path: payload.path, content: payload.content });
});

ToolRegistry.register("write_code", "Alias for write_file. Write code to a file.", { path: "string", content: "string" }, async (payload) => {
    // Alias for write_file
    return await MCPClient.callTool("write_file", { path: payload.path, content: payload.content });
});

ToolRegistry.register("read_file", "Read the contents of a file.", { path: "string" }, async (payload) => {
    // payload: { path }
    return await MCPClient.callTool("read_file", { path: payload.path });
});

ToolRegistry.register("browser", "Open a URL in the default browser.", { url: "string" }, async (payload) => {
    // payload: { url }
    const url = payload.url || payload.query;
    if (!url) return "[Error] URL is required.";
    const command = `open "${url}"`; // MacOS specific, but we know environment
    // Use execute_command via MCP
    const result = await MCPClient.callTool("execute_command", { command });
    return `[System] Opening ${url}...\n${result}\n(Please handle Login/CAPTCHA in the new window)`;
});

ToolRegistry.register("linter", "Run ESLint on a specific path.", { path: "string" }, async (payload) => {
    const target = payload.path || ".";
    // Run eslint via execute_command
    return await MCPClient.callTool("execute_command", { command: `npx eslint "${target}"` });
});
