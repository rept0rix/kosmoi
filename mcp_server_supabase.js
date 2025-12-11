import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the same directory as the script
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_KEY (or VITE_SUPABASE_ANON_KEY) must be set in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create MCP server
const server = new McpServer({
    name: "supabase-mcp",
    version: "1.0.0",
});

// Tool: Get Schema (List Tables)
server.tool(
    "get_schema",
    "Get the list of public tables in the Supabase database to understand the schema.",
    {},
    async () => {
        try {
            // We can't easily "list tables" with just the JS client unless we have access to information_schema or a specific RPC.
            // However, we can try to fetch a known table or simple hack. 
            // A better approach for "schema" with just JS client is restricted. 
            // Let's try to query information_schema if possible, but RLS might block it.
            // Often strictly typed clients are hard for generic exploration.
            // IF we have the SERVICE_ROLE_KEY, we bypass RLS.
            // Let's assume we might need to just list known tables or try to read information_schema.tables.

            const { data, error } = await supabase
                .from('information_schema.tables') // This might fail if postgrest doesn't expose it
                .select('*')
                .eq('table_schema', 'public');

            // Note: PostgREST usually doesn't expose information_schema by default unless configured.
            // If this fails, we might just return a message saying "Schema inspection requires SQL access or configured PostgREST".
            // BUT, many users confuse "supabase client" with "postgres connection".
            // Let's offer a simple 'list_tables' via RPC if available, or just try to generic generic query.

            // Fallback: If the user hasn't exposed information_schema, this will fail.
            // Let's try a different approach: The user likely wants to READ data.

            if (error) {
                return {
                    content: [{ type: "text", text: `Error fetching schema: ${error.message}. ensure information_schema is accessible or use a specific table.` }]
                };
            }

            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };

        } catch (err) {
            return {
                content: [{ type: "text", text: `Exception fetching schema: ${err.message}` }]
            };
        }
    }
);

// Tool: Read Table
server.tool(
    "read_table",
    "Read data from a specific table in Supabase. You can limit the number of rows.",
    {
        tableName: z.string().describe("The name of the table to read from"),
        limit: z.number().optional().describe("Number of rows to return (default: 10)"),
        columns: z.string().optional().describe("Columns to select (default: '*')")
    },
    async ({ tableName, limit = 10, columns = "*" }) => {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select(columns)
                .limit(limit);

            if (error) {
                return {
                    content: [{ type: "text", text: `Error reading table '${tableName}': ${error.message}` }]
                };
            }

            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: `Exception reading table: ${err.message}` }]
            };
        }
    }
);

// Tool: Execute SQL (via RPC)
// IF the user has a `exec_sql` function set up in Supabase (common pattern for admin tools), we can use it.
server.tool(
    "execute_sql",
    "Execute raw SQL query using a 'exec_sql' RPC function if available. This allows complex queries.",
    {
        query: z.string().describe("The SQL query to execute")
    },
    async ({ query }) => {
        try {
            const { data, error } = await supabase.rpc('exec_sql', { query });

            if (error) {
                return {
                    content: [{ type: "text", text: `Error executing SQL: ${error.message}. (Note: this requires an 'exec_sql' function in your database)` }]
                };
            }
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: `Exception executing SQL: ${err.message}` }]
            };
        }
    }
);

// Tool: Request Management API
server.tool(
    "request_management_api",
    "Execute a request against the Supabase Management API to manage projects, organizations, and more. Requires SUPABASE_ACCESS_TOKEN env var.",
    {
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).describe("HTTP method"),
        path: z.string().describe("API path (e.g., '/v1/projects')"),
        body: z.any().optional().describe("JSON body for the request"),
        queryParams: z.record(z.string()).optional().describe("Query parameters")
    },
    async ({ method, path, body, queryParams }) => {
        const token = process.env.SUPABASE_ACCESS_TOKEN;
        if (!token) {
            return {
                content: [{ type: "text", text: "Error: SUPABASE_ACCESS_TOKEN environment variable is required for Management API requests." }]
            };
        }

        try {
            const baseUrl = "https://api.supabase.com";
            // Ensure path starts with /
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            const url = new URL(`${baseUrl}${cleanPath}`);

            if (queryParams) {
                Object.entries(queryParams).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            }

            const response = await fetch(url.toString(), {
                method,
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "User-Agent": "supabase-mcp/1.0.0"
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const text = await response.text();
                return {
                    content: [{ type: "text", text: `Error ${response.status}: ${text}` }]
                };
            }

            // Management API often returns JSON, but sometimes 204 No Content
            if (response.status === 204) {
                return {
                    content: [{ type: "text", text: "Success (No Content)" }]
                };
            }

            const json = await response.json();
            return {
                content: [{ type: "text", text: JSON.stringify(json, null, 2) }]
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: `Exception calling Management API: ${err.message}` }]
            };
        }
    }
);

// Tool: Run Supabase CLI
server.tool(
    "run_supabase_cli",
    "Run Supabase CLI commands. Requires 'supabase' to be in PATH or accessible via npx. Example args: ['migration', 'list']",
    {
        args: z.array(z.string()).describe("Array of command arguments (e.g., ['migration', 'list'])")
    },
    async ({ args }) => {
        return new Promise((resolve) => {
            // Try 'supabase' first, then 'npx supabase' fallback logic could be complex in spawn.
            // We'll just try 'npx supabase' if we suspect it's not installed, but let's stick to 'supabase' or 'npx' based on heuristic?
            // Safer: Just try 'npx supabase' which covers both (local install) or 'supabase' if global. 
            // Actually 'npx supabase' is slow.
            // Let's try 'supabase' and if it fails with ENOENT, return error suggesting install.

            // To make it robust: Use 'npx' if we want to ensure it runs even if not in PATH?
            // But npx is slow for every command.
            // Let's default to 'supabase'.

            const cmd = 'supabase';
            const child = spawn(cmd, args, {
                env: { ...process.env, FORCE_COLOR: '0' }, // Disable color for cleaner output
                shell: true
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => { stdout += data; });
            child.stderr.on('data', (data) => { stderr += data; });

            child.on('error', (err) => {
                resolve({
                    content: [{ type: "text", text: `Failed to start subprocess: ${err.message}` }]
                });
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    // If command not found (127), suggest npx
                    if (stderr.includes('command not found') || code === 127) {
                        resolve({
                            content: [{ type: "text", text: `Error: 'supabase' command not found. Please install Supabase CLI or ensure it is in your PATH.\nStderr: ${stderr}` }]
                        });
                    } else {
                        resolve({
                            content: [{ type: "text", text: `Command failed with code ${code}:\n${stderr}\n${stdout}` }]
                        });
                    }
                } else {
                    resolve({
                        content: [{ type: "text", text: stdout }]
                    });
                }
            });
        });
    }
);

// Tool: Execute Shell Command (Merged from simple-command-mcp)
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
        // Dynamic import exec to match simple-command-mcp usage or just use spawn
        // simple-command-mcp used exec from child_process
        const { exec } = await import("child_process");

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

// Tool: Write File (Merged from simple-command-mcp)
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
    console.error("Supabase MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
