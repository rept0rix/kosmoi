import { ToolRegistry } from "../ToolRegistry.js";
import { db } from "../../../api/supabaseClient.js";

ToolRegistry.register("search_services", async (payload) => {
    // payload: { query, category, location }
    try {
        const { query, category, location } = payload;
        console.log(`[Concierge] Searching DB for: ${query || category}...`);

        let queryBuilder = db.entities.ServiceProvider.select('*');

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
