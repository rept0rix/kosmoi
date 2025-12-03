import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";

// Create server instance
const server = new McpServer({
    name: "simple-command-mcp",
    version: "1.0.0",
});

// Register the execute_command tool
server.tool(
    "execute_command",
    "Execute a shell command on the local machine",
    {
        command: z.string().describe("The command to execute (e.g., 'ls', 'git status')"),
        args: z.array(z.string()).optional().describe("Array of arguments for the command"),
    },
    async ({ command, args }) => {
        const fullCommand = args ? `${command} ${args.join(" ")}` : command;
        console.error(`[MCP] Executing: ${fullCommand}`);

        return new Promise((resolve) => {
            exec(fullCommand, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        content: [{ type: "text", text: `Error: ${error.message}\nStderr: ${stderr}` }],
                        isError: true,
                    });
                } else {
                    resolve({
                        content: [{ type: "text", text: stdout || stderr || "(No output)" }],
                    });
                }
            });
        });
    }
);

// Register the write_file tool
server.tool(
    "write_file",
    "Write content to a file (overwrites existing)",
    {
        path: z.string().describe("Relative path to the file"),
        content: z.string().describe("The content to write"),
    },
    async ({ path: filePath, content }) => {
        console.error(`[MCP] Writing to file: ${filePath}`);
        const fs = await import('fs/promises');
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            return {
                content: [{ type: "text", text: `Successfully wrote to ${filePath}` }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error writing file: ${error.message}` }],
                isError: true,
            };
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Simple Command MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
