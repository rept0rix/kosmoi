
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Mock KnowledgeService logic in a script
async function retrieveContext(queryText) {
    console.log(`\n🔎 Searching for: "${queryText}"`);
    try {
        // 1. Generate Embedding
        const result = await embeddingModel.embedContent(queryText);
        const embedding = result.embedding.values;

        // 2. Search DB
        const { data, error } = await supabase.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3
        });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log("❌ No matches found.");
            return;
        }

        // 3. Print Results
        data.forEach((chunk, i) => {
            const source = chunk.metadata?.title || chunk.metadata?.name || chunk.category || 'Knowledge Base';
            console.log(`\n--- RESULT ${i + 1} (${source}) ---`);
            console.log(chunk.content.substring(0, 200) + "..."); // Truncate for display
            console.log(`[Similarity: ${(chunk.similarity * 100).toFixed(2)}%]`);
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

async function main() {
    await retrieveContext("best beach for families with kids");
    await retrieveContext("real estate investment 2025");
    await retrieveContext("emergency police number");
}

main();
