import { IMCPTool, MCPToolRequest, MCPToolResponse } from "./types";

export class MCPServer {
    private tools: Map<string, IMCPTool> = new Map();
    private static instance: MCPServer;

    private constructor() {
        console.log("🛠️ [MCPServer] Initializing HexStrike-style Agent Protocol...");
    }

    public static getInstance(): MCPServer {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }

    public registerTool(tool: IMCPTool) {
        if (this.tools.has(tool.definition.name)) {
            console.warn(`[MCPServer] Tool '${tool.definition.name}' already registered. Overwriting.`);
        }
        this.tools.set(tool.definition.name, tool);
        console.log(`✅ [MCPServer] Tool registered: ${tool.definition.name} (${tool.definition.version})`);
    }

    public getToolDefinitions() {
        return Array.from(this.tools.values()).map(t => t.definition);
    }

    public async executeTool(request: MCPToolRequest): Promise<MCPToolResponse> {
        const start = performance.now();
        const tool = this.tools.get(request.toolName);

        if (!tool) {
            return {
                success: false,
                result: null,
                error: `Tool '${request.toolName}' not found.`
            };
        }

        try {
            console.log(`🚀 [MCPServer] Executing: ${request.toolName}`);
            const response = await tool.execute(request.arguments);

            // Enrich with meta
            response.meta = {
                executionTimeMs: Math.round(performance.now() - start),
                toolVersion: tool.definition.version
            };

            return response;
        } catch (error) {
            console.error(`💥 [MCPServer] Execution failed for ${request.toolName}:`, error);
            return {
                success: false,
                result: null,
                error: error instanceof Error ? error.message : "Unknown error during execution",
                meta: {
                    executionTimeMs: Math.round(performance.now() - start),
                    toolVersion: tool.definition.version
                }
            };
        }
    }
}

export const mcpServer = MCPServer.getInstance();
