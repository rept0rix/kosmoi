import { supabase } from "../../api/supabaseClient.js";

/**
 * KnowledgeService
 * Handles Retrieval Augmented Generation (RAG) interactions.
 * - Matches user query to relevant documents in `embeddings` table.
 */
export const KnowledgeService = {

    /**
     * Search for relevant context in the knowledge base.
     * @param {string} queryText - The user's input/question.
     * @param {number} threshold - Similarity threshold (0 to 1).
     * @param {number} limit - Max number of chunks to retrieve.
     * @returns {Promise<string>} Concatenated context string.
     */
    retrieveContext: async (queryText, threshold = 0.5, limit = 5) => {
        try {
            // 1. Generate Embedding for query using the Integration helper (Gemini)
            const { GetEmbedding } = await import("../../api/integrations.js");
            const embedding = await GetEmbedding({ text: queryText });

            if (!embedding) {
                console.warn("[KnowledgeService] Failed to generate embedding for query. Aborting RAG.");
                return "";
            }

            // 2. Search in Supabase
            // 2. Search in Supabase
            const { data, error } = await supabase.rpc('match_knowledge', {
                query_embedding: embedding,
                match_threshold: threshold,
                match_count: limit
            });

            if (error) {
                console.error("[KnowledgeService] Database search failed:", error);
                return "";
            }

            if (!data || data.length === 0) {
                return "";
            }

            // 3. Format Context
            // Concatenate matched chunks with file path indicators
            const contextArray = data.map(chunk => {
                return `\n--- FILE: ${chunk.path} ---\n${chunk.content}\n`;
            });

            return contextArray.join("\n");

        } catch (error) {
            console.error("[KnowledgeService] Retrieval failed:", error);
            return "";
        }
    },

    /**
     * Store a document (Client-side usage is rare, mostly done via scripts)
     */
    addDocument: async (content, metadata = {}) => {
        console.warn("[KnowledgeService] Client-side document addition is not yet implemented. Use the indexer script.");
    }
};
