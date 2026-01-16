import { ToolRegistry } from "../ToolRegistry.js";
import { realSupabase as supabase } from "../../../api/supabaseClient.js";

// --- KNOWLEDGE TOOLS ---

ToolRegistry.register(
    "search_knowledge_base",
    "Search the Concierge Knowledge Base (RAG) for island info, history, tips, etc.",
    { query: "The search query" },
    async (payload) => {
        try {
            const { query } = payload;
            console.log(`[Concierge] 🧠 Searching RAG for: ${query}...`);

            // Call Edge Function
            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('search-knowledge', {
                body: { query }
            });

            if (error) throw error;
            if (!data || !data.documents || data.documents.length === 0) {
                return `[RAG] No relevant knowledge found for "${query}".`;
            }

            // Format results for the Agent
            const results = data.documents.map(doc => {
                return `[Constraint/Fact]: ${doc.content}`;
            }).join('\n\n');

            return `[Knowledge Base Results]:\n${results}`;

        } catch (e) {
            console.error("RAG Search failed:", e);
            return `[Error] RAG Search failed: ${e.message}`;
        }
    }
);
