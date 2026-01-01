import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { samuiKnowledge } from '../src/data/samuiKnowledge.js';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key, hope RLS allows insert or use service role if needed
// Actually, RLS policy "Allow service role insert" suggests we need SERVICE_ROLE_KEY for inserts if we want to be strict,
// OR we rely on the fact that we might be running this locally.
// But wait, the migration allows public read, but restricted insert. To run this script, I need the SERVICE ROLE KEY.
// Let's check provided env vars. If only Anon is available, I might need to temporarily open RLS or use a different key.
// But wait, the user's .env usually has SERVICE_ROLE_KEY? Let's assume standard .env structure or just try.
// If it fails, I'll ask for the key or update policy.
// For now, I'll attempt with standard keys. If I have a SERVICE_ROLE_KEY in process.env, precise.

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('Missing VITE_GEMINI_API_KEY in .env');
    process.exit(1);
}

async function generateEmbedding(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "models/text-embedding-004",
            content: {
                parts: [{ text }]
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

function processKnowledge(knowledge) {
    const items = [];

    // Process Beaches
    knowledge.beaches.forEach(beach => {
        items.push({
            content: `Start of Guide: "${beach.name}". Vibe: ${beach.vibe}. Best For: ${beach.bestFor}. Description: ${beach.description} Tips: ${beach.tips}`,
            category: 'beaches',
            metadata: { type: 'place', name: beach.name, vibe: beach.vibe }
        });
    });

    // Process Transport
    Object.keys(knowledge.transport).forEach(key => {
        const t = knowledge.transport[key];
        items.push({
            content: `Transport Guide: ${key}. Description: ${t.description}. Price: ${t.priceRange}. Tips: ${t.tips}`,
            category: 'transport',
            metadata: { type: 'guide', subType: key }
        });
    });

    // Process Culture
    const cultureText = Object.entries(knowledge.culture).map(([k, v]) => `${k}: ${v}`).join('. ');
    items.push({
        content: `Local Culture Guide: ${cultureText}`,
        category: 'culture',
        metadata: { type: 'guide' }
    });

    // Process Activities
    knowledge.activities.forEach(act => {
        items.push({
            content: `Activity: "${act.name}" (${act.type}). ${act.description}. Tips: ${act.tips}`,
            category: 'activities',
            metadata: { type: 'activity', name: act.name }
        });
    });

    return items;
}

async function seed() {
    console.log("🌱 Starting Knowledge Seed...");
    const items = processKnowledge(samuiKnowledge);
    console.log(`Found ${items.length} items to process.`);

    for (const item of items) {
        console.log(`Processing: ${item.content.substring(0, 50)}...`);
        try {
            const vector = await generateEmbedding(item.content);

            const { error } = await supabase.from('knowledge_base').insert({
                content: item.content,
                category: item.category,
                metadata: item.metadata,
                embedding: vector
            });

            if (error) {
                console.error("Supabase Insert Error:", error);
            } else {
                console.log("Saved.");
            }
        } catch (e) {
            console.error("Embedding/Save Failed:", e.message);
        }
        // Basic rate limiting
        await new Promise(r => setTimeout(r, 500));
    }
    console.log("✅ Seeding Complete.");
}

seed();
