import { db } from "@/api/supabaseClient.js";

/**
 * CompanyKnowledge
 * Interface for the 'Shared Brain' of the agents.
 * Connects to 'agent_knowledge' table in Supabase.
 */
export const CompanyKnowledge = {

    /**
     * Add new knowledge
     * @param {Object} item - { content, category, tags, metadata, created_by }
     */
    async add(item) {
        console.log("[CompanyKnowledge] Adding:", item);
        try {
            // Check if embedding generation is available (Optimistic: Assume No for now, just text)
            // In a real implementation, we would call an embedding service here.

            const { error } = await db.from('agent_knowledge').insert({
                content: item.content,
                category: item.category,
                tags: item.tags,
                metadata: item.metadata,
                created_by: item.created_by
                // embedding: ... // TODO: Add embedding generation later
            });

            if (error) throw error;
            return true;
        } catch (e) {
            console.error("[CompanyKnowledge] Add failed:", e);
            throw e;
        }
    },

    /**
     * Search knowledge
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async search(query) {
        console.log("[CompanyKnowledge] Searching for:", query);
        try {
            // 1. Text Search (Simple 'ilike' for now)
            // Ideally we use Supabase textSearch or the vector match function

            const { data, error } = await db.from('agent_knowledge')
                .select('*')
                .or(`content.ilike.%${query}%,category.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;
            return data;
        } catch (e) {
            console.error("[CompanyKnowledge] Search failed:", e);
            return [];
        }
    },

    // Legacy support for Key-Value get/set (mapped to 'settings' category or specific lookup)
    async get(key) {
        // Try to find a knowledge item where content starts with key or metadata has key
        // This is a rough approximation for legacy compatibility
        const results = await this.search(key);
        return results.length > 0 ? results[0].content : null;
    },

    async set(key, value, category = 'settings', agentId = 'system') {
        return await this.add({
            content: `${key}: ${JSON.stringify(value)}`,
            category,
            created_by: agentId,
            metadata: { type: 'key-value', key }
        });
    }
};
