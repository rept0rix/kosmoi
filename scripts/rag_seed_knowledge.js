
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { samuiKnowledge } from '../src/data/samuiKnowledge.js';

// Init
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Service Role for Write Access
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("❌ Missing params. Check .env for VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY, VITE_GEMINI_API_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); // or embedding-001

async function generateEmbedding(text) {
    // "text-embedding-004" output dimensionality is 768 by default
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// Transform Knowledge Object to Flat Chunks
function flattenKnowledge(data) {
    let chunks = [];

    // Beaches
    if (data.beaches) {
        data.beaches.forEach(b => {
            const content = `Beach: ${b.name} in Koh Samui. Vibe: ${b.vibe}. Best For: ${b.bestFor}. Description: ${b.description}. Tips: ${b.tips}`;
            chunks.push({ content, category: 'beach', metadata: b });
        });
    }

    // Transport
    if (data.transport) {
        for (const [key, t] of Object.entries(data.transport)) {
            const content = `Transport: ${key} in Koh Samui. Description: ${t.description}. Price: ${t.priceRange}. Tips: ${t.tips}`;
            chunks.push({ content, category: 'transport', metadata: { type: key, ...t } });
        }
    }

    // Culture
    if (data.culture) {
        for (const [key, val] of Object.entries(data.culture)) {
            const content = `Culture: ${key} in Koh Samui. Rule/Tip: ${val}`;
            chunks.push({ content, category: 'culture', metadata: { key } });
        }
    }

    // Activities
    if (data.activities) {
        data.activities.forEach(a => {
            const content = `Activity: ${a.name} (${a.type}) in Koh Samui. ${a.description}. Tips: ${a.tips}`;
            chunks.push({ content, category: 'activity', metadata: a });
        });
    }

    // Emergency
    if (data.emergency) {
        let content = `Emergency Numbers in Koh Samui: `;
        for (const [key, val] of Object.entries(data.emergency)) {
            if (Array.isArray(val)) content += `${key}: ${val.join(', ')}. `;
            else content += `${key}: ${val}. `;
        }
        chunks.push({ content, category: 'emergency', metadata: data.emergency });
    }

    return chunks;
}

async function seed() {
    console.log("🌱 Starting RAG Seed...");

    const chunks = flattenKnowledge(samuiKnowledge);
    console.log(`📦 Prepared ${chunks.length} text chunks.`);

    // Optional: Clear existing?
    // await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    for (const chunk of chunks) {
        try {
            console.log(`🧠 Embedding: ${chunk.content.substring(0, 50)}...`);
            const vector = await generateEmbedding(chunk.content);

            const { error } = await supabase.from('knowledge_base').insert({
                content: chunk.content,
                category: chunk.category,
                metadata: chunk.metadata,
                embedding: vector
            });

            if (error) throw error;
        } catch (e) {
            console.error(`❌ Failed chunk: ${chunk.content}`, e);
        }
    }

    console.log("✅ Seeding Complete!");
}

seed();
