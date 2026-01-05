import { ToolRegistry } from "../ToolRegistry.js";
import { realSupabase as supabase } from "../../../api/supabaseClient.js";

// --- SEARCH TOOL ---
// --- SEARCH TOOL ---
// --- SEARCH TOOL ---
ToolRegistry.register(
    "search_services",
    "Search the database for businesses",
    {
        query: "Search term",
        category: "Filter by category",
        location: "Filter by location"
    },
    async (payload) => {
        // payload: { query, category, location }
        try {
            const { query, category, location } = payload;
            console.log(`[Concierge] Searching DB for: ${query || category || 'everything'}...`);

            let queryBuilder = supabase.from('service_providers').select('*');

            if (query) {
                // Broad Search: Name, Description, Categories, Location
                // "ilike" is case-insensitive.
                queryBuilder = queryBuilder.or(`business_name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,sub_category.ilike.%${query}%,super_category.ilike.%${query}%,location.ilike.%${query}%`);
            }

            if (category) {
                // Precise Category Filter
                queryBuilder = queryBuilder.ilike('category', `%${category}%`);
            }

            if (location) {
                queryBuilder = queryBuilder.ilike('location', `%${location}%`);
            }

            // Prioritize verified and high rating, increase limit for better choice
            const { data, error } = await queryBuilder
                .order('verified', { ascending: false })
                .order('average_rating', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (!data || data.length === 0) {
                return `[Database] No results found for "${query || category}".`;
            }

            // Format results for the agent 
            // We include IMAGE URL so the agent can use it in UI.
            const results = data.map(p => {
                // Image Handling
                let imgUrl = null;
                if (p.images && p.images.length > 0) {
                    const rawImg = p.images[0];
                    if (rawImg.startsWith('http')) {
                        imgUrl = rawImg;
                    } else {
                        // Internal Supabase Storage URL
                        imgUrl = `https://kgnuutevrytqrirgybla.supabase.co/storage/v1/object/public/provider-images/${rawImg}`;
                    }
                }

                return JSON.stringify({
                    id: p.id,
                    title: p.business_name,
                    category: p.sub_category || p.category, // Use sub_category for more detail
                    rating: p.average_rating || 0,
                    location: p.location || "Koh Samui",
                    image: imgUrl || "https://kgnuutevrytqrirgybla.supabase.co/storage/v1/object/public/provider-images/placeholder.jpg",
                    vibes: [p.status === 'verified' ? 'Verified' : 'Local', p.category],
                    priceLevel: p.metadata?.priceLevel || "$$"
                });
            }).join('\n');

            return `[Database Results]:\n${results}`;

        } catch (e) {
            console.error("Search failed:", e);
            return `[Error] Database search failed: ${e.message}`;
        }
    });

// --- SUPABASE SPECIALIST TOOLS ---

ToolRegistry.register(
    "read_table",
    "Read rows from a table",
    { table: "Table name", query: "Optional filter string" },
    async (payload) => {
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

ToolRegistry.register(
    "execute_sql",
    "Execute raw SQL (Admin only)",
    { query: "SQL Query" },
    async (payload) => {
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

ToolRegistry.register(
    "get_schema",
    "Get database schema information",
    {},
    async () => {
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
