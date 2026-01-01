import { db } from '@/api/supabaseClient';
import { ToolRegistry } from '../ToolRegistry';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function generateEmbedding(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] }
        })
    });

    if (!response.ok) {
        console.error("Embedding failed", await response.text());
        throw new Error("Failed to generate embedding");
    }

    const data = await response.json();
    return data.embedding.values;
}

ToolRegistry.register(
    'search_knowledge_base',
    'Search the internal knowledge base for information about Koh Samui (beaches, culture, transport, local tips). Use this BEFORE defaulting to general knowledge.',
    {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The semantic search query (e.g., "quiet beaches for couples", "taxi prices")'
            },
            limit: {
                type: 'number',
                description: 'Max number of results to return (default: 3)',
                default: 3
            }
        },
        required: ['query']
    },
    async ({ query, limit = 3 }) => {
        try {
            const embedding = await generateEmbedding(query);

            const { data, error } = await db.rpc('match_knowledge', {
                query_embedding: embedding,
                match_threshold: 0.65, // Slightly lower threshold to ensure some results
                match_count: limit
            });

            if (error) throw error;

            if (!data || data.length === 0) {
                return "No specific internal records found. You may rely on your general training.";
            }

            return data.map(item => `
---
Content: ${item.content}
Metadata: ${JSON.stringify(item.metadata)}
---
            `).join('\n');

        } catch (error) {
            console.error("Knowledge search failed:", error);
            return "Error searching knowledge base. Proceed with caution.";
        }
    }
);
