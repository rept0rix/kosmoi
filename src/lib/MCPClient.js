/**
 * MCP Client Helper
 * Centralizes communication with the local MCP Proxy via WebSocket.
 */
export const MCPClient = {
    /**
     * Call a tool on the MCP Server.
     * @param {string} toolName - Name of the tool (e.g. 'execute_command', 'write_file')
     * @param {Object} args - Arguments for the tool
     * @param {number} [timeoutMs=15000] - Timeout in milliseconds
     * @returns {Promise<string>} - The result content or error message
     */
    async callTool(toolName, args, timeoutMs = 15000) {
        console.log(`[MCP Client] Calling ${toolName} with args:`, args);

        // Safety check
        if (toolName === 'execute_command' && !args.command) {
            return `[Error] Command is required for execute_command.`;
        }

        try {
            const ws = new WebSocket('ws://localhost:3001');

            return await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve(`[Error] Tool '${toolName}' timed out after ${timeoutMs}ms.`);
                }, timeoutMs);

                const INIT_ID = 1;
                const CALL_ID = 3;

                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        jsonrpc: "2.0",
                        id: INIT_ID,
                        method: "initialize",
                        params: {
                            protocolVersion: "2024-11-05",
                            capabilities: {},
                            clientInfo: { name: "samui-client", version: "1.0.0" }
                        }
                    }));
                };

                ws.onerror = (err) => {
                    // @ts-ignore
                    const msg = err.message || "Connection failed";
                    resolve(`[Error] MCP Proxy Connection Failed: ${msg}. Is 'node mcp-proxy.js' running?`);
                };

                ws.onclose = () => {
                    // Handled by timeout/error if premature
                };

                ws.onmessage = (event) => {
                    try {
                        const response = JSON.parse(event.data);

                        if (response.id === INIT_ID) {
                            // Initialized, send notifications and call tool
                            ws.send(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }));

                            // Call the tool directly
                            ws.send(JSON.stringify({
                                jsonrpc: "2.0",
                                id: CALL_ID,
                                method: "tools/call",
                                params: {
                                    name: toolName,
                                    arguments: args
                                }
                            }));
                        } else if (response.id === CALL_ID) {
                            clearTimeout(timeout);
                            ws.close();

                            if (response.error) {
                                resolve(`[Error] MCP Tool Failed: ${response.error.message}`);
                            } else {
                                const content = response.result?.content?.[0]?.text || JSON.stringify(response.result);
                                resolve(content);
                            }
                        }
                    } catch (e) {
                        console.error("MCP Parse Error:", e);
                        resolve(`[Error] Failed to parse MCP response: ${e.message}`);
                    }
                };
            });
        } catch (e) {
            return `[Error] MCP Client Exception: ${e.message}`;
        }
    }
};
