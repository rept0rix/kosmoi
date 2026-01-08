
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('Missing credentials (Supabase or Gemini)');
    process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function verifyRagTool() {
    const query = "What is the best time to visit Koh Samui?";
    console.log(`🔍 Testing RAG Search for: "${query}"`);

    // 1. Generate Embedding
    console.log("1. Generating Embedding (simulating GetEmbedding)...");
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(query);
        const embedding = result.embedding.values;

        console.log(`✅ Embedding generated. Length: ${embedding.length}`);

        if (embedding.length !== 768) {
            console.warn(`⚠️ Warning: Expected 768 dimensions, got ${embedding.length}. Match might fail.`);
        }

        // 2. Search
        console.log("2. Calling match_knowledge RPC...");
        const { data, error } = await db.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.1, // Low threshold for test to ensure SOME match if data exists
            match_count: 3
        });

        if (error) {
            console.error("❌ RPC Error:", error);
        } else {
            console.log(`✅ RPC Success. Matches found: ${data ? data.length : 0}`);
            if (data && data.length > 0) {
                data.forEach((match, i) => {
                    console.log(`   [${i + 1}] (${match.similarity.toFixed(2)}) ${match.content.substring(0, 100)}...`);
                });
            } else {
                console.log("   (No matches found - Knowledge base might be empty)");
            }
        }

    } catch (err) {
        console.error("💥 Unexpected Error:", err);
    }
}

verifyRagTool();
