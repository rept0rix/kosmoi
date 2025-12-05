import { db } from '../../api/supabaseClient.js';

/**
 * Service for managing persistent company knowledge.
 * Acts as a shared brain for all agents.
 */
export const CompanyKnowledge = {
    /**
     * Retrieve a piece of knowledge by key.
     * @param {string} key - The unique key (e.g., "staging_url", "brand_colors").
     * @returns {Promise<any>} The value or null if not found.
     */
    async get(key) {
        try {
            const record = await db.CompanyKnowledge.get(key);
            return record ? record.value : null;
        } catch (error) {
            console.error(`[CompanyKnowledge] Failed to get key '${key}': `, error);
            return null;
        }
    },

    /**
     * Store a piece of knowledge.
     * @param {string} key - The unique key.
     * @param {any} value - The value (will be JSON stringified if object).
     * @param {string} category - Optional category for grouping (e.g., "config", "credentials").
     * @param {string} agentId - The ID of the agent updating this knowledge.
     */
    async set(key, value, category = 'general', agentId = 'system') {
        try {
            await db.CompanyKnowledge.upsert({
                key,
                value,
                category,
                updated_by: agentId,
                updated_at: new Date().toISOString()
            });
            console.log(`[CompanyKnowledge] Saved '${key}' by ${agentId} `);
        } catch (error) {
            console.error(`[CompanyKnowledge] Failed to set key '${key}': `, error);
        }
    },

    /**
     * List all knowledge items, optionally filtered by category.
     * @param {string} [category] - Filter by category.
     * @returns {Promise<Array>} List of knowledge records.
     */
    async list(category) {
        try {
            const records = await db.CompanyKnowledge.list(category);
            return records || [];
        } catch (error) {
            console.error(`[CompanyKnowledge] Failed to list knowledge: `, error);
            return [];
        }
    },

    /**
     * Delete a knowledge item.
     * @param {string} key 
     */
    async delete(key) {
        try {
            await db.CompanyKnowledge.delete(key);
        } catch (error) {
            console.error(`[CompanyKnowledge] Failed to delete key '${key}': `, error);
        }
    }
};
