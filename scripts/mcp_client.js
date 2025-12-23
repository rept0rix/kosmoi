
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export class MCPClientManager {
    constructor() {
        this.clients = new Map(); // serverName -> { client, transport }
        this.tools = [];
    }

    async init() {
        console.log("🔌 Initializing MCP Client Manager...");
        const mcpConfigPath = path.join(PROJECT_ROOT, '.mcp.json');

        if (!fs.existsSync(mcpConfigPath)) {
            console.warn("⚠️ .mcp.json not found. Skipping MCP initialization.");
            return;
        }

        try {
            const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
            const servers = config.mcpServers || {};

            for (const [name, serverConfig] of Object.entries(servers)) {
                try {
                    console.log(`🔌 Connecting to MCP Server: ${name}...`);

                    // Prepare command and args (handling implied npx or shell)
                    const command = serverConfig.command;
                    const args = serverConfig.args || [];
                    const env = { ...process.env, ...(serverConfig.env || {}) };

                    const transport = new StdioClientTransport({
                        command: command,
                        args: args,
                        env: env
                    });

                    const client = new Client({
                        name: "kosmoi-worker",
                        version: "1.0.0",
                    }, {
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {}
                        }
                    });

                    await client.connect(transport);

                    // List tools
                    const toolsResult = await client.listTools();
                    const serverTools = toolsResult.tools.map(tool => ({
                        ...tool,
                        serverName: name
                    }));

                    this.clients.set(name, client);
                    this.tools.push(...serverTools);

                    console.log(`✅ Connected to ${name}. Found ${serverTools.length} tools.`);

                } catch (err) {
                    console.error(`❌ Failed to connect to MCP Server '${name}':`, err.message);
                }
            }

        } catch (e) {
            console.error("❌ Error loading .mcp.json:", e.message);
        }
    }

    getTools() {
        return this.tools;
    }

    formatToolsSystemPrompt() {
        if (this.tools.length === 0) return "";

        return `
### EXTENDED MCP TOOLS AVAILABLE:
You have access to the following external tools via the Model Context Protocol (MCP).
Use them just like your native tools.

${this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

To use these tools, output a JSON action block with "name": "tool_name".
`;
    }

    async callTool(name, args) {
        // Find which server has this tool
        const toolDef = this.tools.find(t => t.name === name);
        if (!toolDef) {
            throw new Error(`Tool '${name}' not found in any connected MCP server.`);
        }

        const client = this.clients.get(toolDef.serverName);
        if (!client) {
            throw new Error(`Client for server '${toolDef.serverName}' is not connected.`);
        }

        console.log(`🔌 calling MCP tool '${name}' on server '${toolDef.serverName}'...`);
        const result = await client.callTool({
            name: name,
            arguments: args
        });

        // MCP results are often { content: [ { type: 'text', text: '...' } ] }
        // We want to return a string representation
        if (result.content && Array.isArray(result.content)) {
            return result.content.map(item => {
                if (item.type === 'text') return item.text;
                if (item.type === 'image') return `[Image Content]`; // Or handle images
                return JSON.stringify(item);
            }).join('\n');
        }

        return JSON.stringify(result);
    }

    async cleanup() {
        for (const [name, client] of this.clients) {
            try {
                // There isn 't a disconnect explicit method on Client in all versions, 
                // but usually closing transport is enough.
                // client.transport.close(); // Stdio transport close
            } catch (e) {
                console.error(`Error closing ${name}:`, e.message);
            }
        }
    }
}
