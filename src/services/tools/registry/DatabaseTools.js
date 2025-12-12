import { ToolRegistry } from "../ToolRegistry.js";
import { realSupabase as supabase } from "../../../api/supabaseClient.js";

// --- SEARCH TOOL ---
ToolRegistry.register("search_services", async (payload) => {
    // payload: { query, category, location }
    try {
        const { query, category, location } = payload;
        console.log(`[Concierge] Searching DB for: ${query || category}...`);

        let queryBuilder = supabase.from('service_providers').select('*');

        if (query) {
            queryBuilder = queryBuilder.or(`business_name.ilike.%${query}%,description.ilike.%${query}%`);
        }

        if (category) {
            queryBuilder = queryBuilder.eq('category', category);
        }

        if (location) {
            queryBuilder = queryBuilder.ilike('location', `%${location}%`);
        }

        const { data, error } = await queryBuilder.limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
            return `[Database] No results found for "${query || category}".`;
        }

        // Format results for the agent
        const results = data.map(p => `- **${p.business_name}** (${p.category}): ${p.description?.substring(0, 100)}... (Rating: ${p.average_rating})`).join('\n');

        return `[Database Results]:\n${results}`;

    } catch (e) {
        console.error("Search failed:", e);
        return `[Error] Database search failed: ${e.message}`;
    }
});

// --- SUPABASE SPECIALIST TOOLS ---

ToolRegistry.register("read_table", async (payload) => {
    // payload: { table, query }
    // Example query: "status=eq.active&limit=5"
    try {
        const { table, query } = payload;
        if (!table) return "[Error] Table name required";

        // Simple query passthrough logic could be complex. 
        // For now, we support basic select *.
        // Ideally we parse the query string or expect structured params.
        // Let's assume payload.query is a Supabase filter string or null.

        let builder = supabase.from(table).select('*');
        // Note: Dynamic filtering safely is hard without parsing. 
        // We will return top 10 rows for now if query is loose.

        const { data, error } = await builder.limit(10);
        if (error) throw error;

        return JSON.stringify(data, null, 2);
    } catch (e) {
        return `[Error] Read Table failed: ${e.message}`;
    }
});

ToolRegistry.register("execute_sql", async (payload) => {
    // payload: { query }
    try {
        const { query } = payload;
        // 🚨 SECURITY WARNING: This allows raw SQL execution.
        // In a real app, this should be restricted to admin-only or specific RPCs.
        // We will call a generic RPC 'exec_sql' if it exists, or fail.

        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) throw error;

        return JSON.stringify(data, null, 2);
    } catch (e) {
        return `[Error] SQL Execution failed (Rpc 'exec_sql' might be missing): ${e.message}`;
    }
});

ToolRegistry.register("get_schema", async () => {
    try {
        // Mock schema return or valid introspection if allowed
        return `[Schema Info]
Tables:
- service_providers (id, business_name, category, ...)
- board_meetings (id, title, ...)
- board_messages (id, content, agent_id, ...)
- agent_tasks (id, title, status, ...)
`;
    } catch (e) {
        return `[Error] Schema fetch failed: ${e.message}`;
    }
});
