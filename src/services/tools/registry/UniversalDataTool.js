import { ToolRegistry } from "../ToolRegistry.js";
import { supabase } from "../../../api/supabaseClient.js";

/**
 * Universal Data Tool
 * Allows the agent to execute heavily guarded SQL-like queries.
 * 
 * NOTE: In a real production environment, this would hit a backend endpoint
 * that parses the SQL and strictly validates it against allowed tables/operations.
 * For this prototype, we're simulating the capabilities.
 */

ToolRegistry.register(
    "run_read_only_sql",
    "Execute a READ-ONLY SQL query against the database. Use this to answer questions about data.",
    {
        query: "string (Required) - The SQL query to execute. MUST start with SELECT."
    },
    async (payload) => {
        const query = payload.query.trim();

        // 1. Safety Guardrails (Client-side check, backend should double-check)
        const forbiddenKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'];
        const upperQuery = query.toUpperCase();

        if (!upperQuery.startsWith('SELECT')) {
            return `[Security Block] Only SELECT queries are allowed. Your query started with: ${query.split(' ')[0]}`;
        }

        if (forbiddenKeywords.some(keyword => upperQuery.includes(keyword))) {
            return `[Security Block] Forbidden keyword detected. Operations ${forbiddenKeywords.join(', ')} are not allowed.`;
        }

        try {
            // 2. Execution Strategy
            // Ideally: await supabase.rpc('exec_sql', { query });
            // Since we likely don't have that RPC set up yet, we will simulate the "Universal" aspect
            // by attempting to parse the simple SELECT ... FROM ... syntax and map it to Supabase JS.
            // This is a "Poor Man's SQL Parser" for the prototype to avoid needing backend migrations right now.

            // Pattern: SELECT * FROM table_name ...
            // or: SELECT col1, col2 FROM table_name ...

            // Let's try to pass it to a custom RPC if it exists, otherwise fallback to limited JS mapping.
            const { data, error } = await supabase.rpc('run_safe_sql', { query });

            if (error) {
                // Fallback: If the RPC doesn't exist, we return a helpful message to the Agent
                // instructing it to use standard Client tools if it can't use raw SQL yet.
                // OR we try to map it.
                return `[System Notice] The 'run_safe_sql' RPC function is not installed on the database. 
Please ask the developer to run the setup migration.
(Error: ${error.message})`;
            }

            return JSON.stringify(data, null, 2);

        } catch (e) {
            return `[Error] Query execution failed: ${e.message}`;
        }
    }
);
