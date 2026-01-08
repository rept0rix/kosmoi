import { IMCPTool, MCPToolDefinition, MCPToolRequest, MCPToolResponse } from "../types";
import { db } from "../../../api/supabaseClient.js";
// @ts-ignore
import { GetEmbedding } from "../../../api/integrations.js";

export class KnowledgeBaseTool implements IMCPTool {
    definition: MCPToolDefinition = {
        name: "search_knowledge_base",
        description: "Searches the Koh Samui knowledge base for information about history, culture, activities, and general island queries. Use this for 'How to', 'What is', and general questions.",
        version: "1.0.0",
        parameters: {
            query: {
                type: "string",
                description: "The search query (e.g. 'history of Fisherman's Village' or 'best time to visit')",
                required: true
            },
            limit: {
                type: "number",
                description: "Max number of results to return (default 5)",
                required: false
            }
        }
    };

    async execute(args: Record<string, any>): Promise<MCPToolResponse> {
        const query = args.query;
        const limit = args.limit || 5;

        if (!query) {
            return { success: false, result: null, error: "Missing 'query' parameter" };
        }

        try {
            console.log(`🔍 [KnowledgeBaseTool] Searching for: "${query}"`);

            // 1. Generate Embedding
            const embedding = await GetEmbedding({ text: query });

            if (!embedding) {
                // If embedding fails (e.g. missing API key), fallback to keyword search or error
                console.warn("⚠️ [KnowledgeBaseTool] Failed to generate embedding. Check API Key.");
                return {
                    success: false,
                    result: null,
                    error: "Failed to generate embedding for search query. Service may be unavailable."
                };
            }

            // 2. Vector Search via RPC
            const { data, error } = await db.rpc('match_knowledge', {
                query_embedding: embedding,
                match_threshold: 0.5, // Moderate threshold
                match_count: limit
            });

            if (error) {
                console.error("❌ [KnowledgeBaseTool] RPC Error:", error);
                // Fallback to text search if RPC fails (unexpected)
                // For now, return error
                return {
                    success: false,
                    result: null,
                    error: `Database search failed: ${error.message}`
                };
            }

            if (!data || data.length === 0) {
                return {
                    success: true,
                    result: {
                        query: query,
                        matches: [],
                        note: "No relevant information found in the knowledge base."
                    }
                };
            }

            // 3. Format Results
            const formattedMatches = data.map((item: any) => ({
                content: item.content,
                similarity: item.similarity,
                metadata: item.metadata
            }));

            return {
                success: true,
                result: {
                    query: query,
                    matches: formattedMatches
                }
            };

        } catch (error) {
            console.error("💥 [KnowledgeBaseTool] Exception:", error);
            return {
                success: false,
                result: null,
                error: (error as Error).message
            };
        }
    }
}
