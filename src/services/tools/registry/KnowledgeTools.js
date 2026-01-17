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

ToolRegistry.register(
    "read_knowledge",
    "Read a specific key from the company knowledge base.",
    { key: "The knowledge key to read" },
    async (payload) => {
        try {
            const { key } = payload;
            const { data, error } = await supabase.from('company_knowledge').select('*').eq('key', key).single();
            if (error) {
                if (error.code === 'PGRST116') return `[Knowledge] Key "${key}" not found.`;
                throw error;
            }
            return `[Knowledge] ${key}:\n${JSON.stringify(data.value, null, 2)}`;
        } catch (e) {
            return `[Error] Failed to read knowledge: ${e.message}`;
        }
    }
);

ToolRegistry.register(
    "write_knowledge",
    "Write or update a key in the company knowledge base.",
    { key: "The key to save under", value: "The value to save (string or object)", category: "Optional category" },
    async (payload) => {
        try {
            const { key, value, category } = payload;
            const { data, error } = await supabase.from('company_knowledge').upsert({
                key,
                value,
                category: category || 'general',
                updated_at: new Date().toISOString()
            }).select().single();

            if (error) throw error;
            return `[Knowledge] Successfully saved key "${key}".`;
        } catch (e) {
            return `[Error] Failed to write knowledge: ${e.message}`;
        }
    }
);
