import { supabase } from '../../api/supabaseClient.js';

/**
 * Service to inspect the database schema dynamically.
 * Used by the Universal Database Agent to understand the data structure.
 */
export const SchemaInspector = {

    /**
     * Fetches the public schema definition.
     * @returns {Promise<Object>} A map of table_name -> [column definitions]
     */
    async getPublicSchema() {
        try {
            // We use the specialized RPC function 'get_schema_info' if available,
            // or fallback to inspecting specific known tables if not.
            // Since we can't easily query information_schema directly from the client without permissions,
            // we will simulate this for the prototype by checking a known list of tables
            // OR by trying to fetch a single row from common tables to infer columns.

            // OPTION A: If we have an RPC function (Best Practice)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_schema_dump');
            if (!rpcError && rpcData) {
                return rpcData;
            }

            // OPTION B: Client-side Inference (Fallback prototype)
            // We will list the known tables we want the agent to access.
            // In a real "Agoda API Agent" implementation, this would be fully dynamic via a backend Admin service.
            const targetTables = [
                'users',
                'calendar_events',
                'agent_logs',
                'agent_tasks',
                'bookings',
                'properties',
                'agent_configs'
            ];

            const schemaMap = {};

            for (const table of targetTables) {
                // Fetch 0 rows just to get the structure if possible, 
                // but supabase-js select('*') returns data, not types strictly.
                // We'll fetch 1 row.
                const { data, error } = await supabase.from(table).select('*').limit(1);

                if (!error && data) {
                    if (data.length > 0) {
                        // Inferred from data
                        schemaMap[table] = Object.keys(data[0]).map(key => ({
                            name: key,
                            type: typeof data[0][key] // Rough approximation
                        }));
                    } else {
                        // Table exists but empty, we can't infer easily without admin API.
                        // For prototype, we mark it as "Empty/Unknown structure"
                        schemaMap[table] = "Empty table - columns unknown via client";
                    }
                }
            }

            return schemaMap;

        } catch (error) {
            console.error("SchemaInspector Error:", error);
            return { error: "Failed to inspect schema" };
        }
    },

    /**
     * Formats the schema into a string suitable for an LLM System Prompt.
     */
    formatForPrompt(schema) {
        let prompt = "Database Schema:\n";
        for (const [table, columns] of Object.entries(schema)) {
            prompt += `- Table: ${table}\n`;
            if (Array.isArray(columns)) {
                columns.forEach(col => {
                    prompt += `  - ${col.name} (${col.type})\n`;
                });
            } else {
                prompt += `  - ${columns}\n`;
            }
        }
        return prompt;
    }
};
