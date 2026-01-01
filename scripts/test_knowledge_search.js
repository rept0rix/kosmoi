import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !GEMINI_API_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.embedding.values;
}

async function testSearch(query) {
    console.log(`\n🔎 Searching for: "${query}"`);
    try {
        const vector = await generateEmbedding(query);
        const { data, error } = await supabase.rpc('match_knowledge', {
            query_embedding: vector,
            match_threshold: 0.5,
            match_count: 3
        });

        if (error) {
            console.error("RPC Error:", error);
            return;
        }

        if (data.length === 0) {
            console.log("No matches found.");
        } else {
            data.forEach((item, i) => {
                console.log(`[${i + 1}] (${item.similarity.toFixed(4)}) ${item.content.substring(0, 100)}...`);
            });
        }
    } catch (e) {
        console.error("Test Failed:", e.message);
    }
}

async function run() {
    await testSearch("What are the best beaches for families?");
    await testSearch("Where can I find street food?");
    await testSearch("Are there any hidden waterfalls?");
}

run();
