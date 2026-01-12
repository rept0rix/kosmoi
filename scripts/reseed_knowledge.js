
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { samuiKnowledge } from '../src/data/samuiKnowledge.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !apiKey) {
    console.error("❌ Missing env vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function getEmbedding(text) {
    if (!text) return null;
    try {
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        console.error("Embedding error:", e.message);
        return null;
    }
}

async function runSeed() {
    console.log("🌱 Starting Re-Seed of Knowledge Base...");

    // 1. Clear Table
    console.log("🧹 Clearing existing data...");
    // UUID compatible "delete all" hack
    const { error: delError } = await supabase.from('knowledge_base')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (delError) {
        console.error("Error clearing table:", delError);
    }

    // 2. Process Data
    let count = 0;

    // Flatten categorical object
    const items = [];
    if (Array.isArray(samuiKnowledge)) {
        items.push(...samuiKnowledge);
    } else {
        Object.keys(samuiKnowledge).forEach(cat => {
            const catItems = samuiKnowledge[cat];
            if (Array.isArray(catItems)) {
                catItems.forEach(item => items.push({ ...item, category: cat }));
            } else if (typeof catItems === 'object') {
                Object.keys(catItems).forEach(subKey => {
                    items.push({
                        ...catItems[subKey],
                        name: subKey,
                        category: cat
                    });
                });
            }
        });
    }

    console.log(`📦 Found ${items.length} items to process.`);

    for (const item of items) {
        const content = item.description
            ? `${item.name}: ${item.description}. Tips: ${item.tips}`
            : JSON.stringify(item);

        const path = item.name || item.title || 'Unknown';

        // Generate Embedding
        const embedding = await getEmbedding(content);
        if (!embedding) continue;

        const payload = {
            // path: path, // Removed, mapping to metadata
            content: content,
            category: item.category || 'general',
            // tags: item.tags || [], // Removed, mapping to metadata
            embedding: embedding,
            metadata: {
                path: path,
                tags: item.tags || []
            }
        };

        const { error } = await supabase.from('knowledge_base').insert(payload);

        if (error) {
            console.error(`❌ Failed to insert ${path}:`, error.message);
        } else {
            process.stdout.write('.');
            count++;
        }

        // Rate limit kindness
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✅ Reseed Complete. Inserted ${count} items.`);
}

runSeed();
