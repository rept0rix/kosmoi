export interface MCPToolDefinition {
    name: string;
    description: string;
    version: string;
    parameters: {
        [key: string]: {
            type: string;
            description: string;
            required: boolean;
        };
    };
}

export interface MCPToolRequest {
    toolName: string;
    arguments: Record<string, any>;
}

export interface MCPToolResponse {
    success: boolean;
    result: any;
    error?: string;
    meta?: {
        executionTimeMs: number;
        toolVersion: string;
    };
}

export interface IMCPTool {
    definition: MCPToolDefinition;
    execute(args: Record<string, any>): Promise<MCPToolResponse>;
}
