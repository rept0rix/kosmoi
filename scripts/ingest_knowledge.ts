
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { samuiKnowledge } from "../src/data/samuiKnowledge.js";
import { blogPosts } from "../src/data/blogPosts.js";

// Load environment variables
const env = config();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
    console.error("Missing required environment variables.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbedding(text: string) {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

async function ingestItem(content: string, category: string, metadata: any) {
    try {
        console.log(`Processing: ${category} - ${metadata.title || metadata.name || 'Unknown'}`);
        const embedding = await generateEmbedding(content);

        const { error } = await supabase
            .from('knowledge_base')
            .insert({
                content,
                category,
                embedding,
                metadata
            });

        if (error) {
            console.error(`Error inserting ${category}:`, error);
        } else {
            console.log(`Inserted: ${category}`);
        }
    } catch (err) {
        console.error(`Failed to ingest item:`, err);
    }
}

async function main() {
    console.log("Starting Knowledge Ingestion...");

    // 1. Ingest Beaches
    for (const beach of samuiKnowledge.beaches) {
        const content = `Beach: ${beach.name}. Vibe: ${beach.vibe}. Best For: ${beach.bestFor}. Description: ${beach.description}. Tips: ${beach.tips}`;
        await ingestItem(content, 'beaches', beach);
    }

    // 2. Ingest Transport
    for (const [key, transport] of Object.entries(samuiKnowledge.transport)) {
        const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
        const content = `Transport: ${name}. Description: ${transport.description}. Price: ${transport.priceRange}. Tips: ${transport.tips}`;
        await ingestItem(content, 'transport', { name, ...transport });
    }

    // 3. Ingest Culture
    const cultureContent = `Samui Culture: Temples - ${samuiKnowledge.culture.temples} Greeting - ${samuiKnowledge.culture.greeting} Feet - ${samuiKnowledge.culture.feet} Head - ${samuiKnowledge.culture.head}`;
    await ingestItem(cultureContent, 'culture', { name: "General Culture", ...samuiKnowledge.culture });

    // 4. Ingest Activities
    for (const activity of samuiKnowledge.activities) {
        const content = `Activity: ${activity.name} (${activity.type}). Description: ${activity.description}. Tips: ${activity.tips}`;
        await ingestItem(content, 'activities', activity);
    }

    // 5. Ingest Emergency
    const emergencyContent = `Emergency Numbers Samui: Tourist Police ${samuiKnowledge.emergency.touristPolice}, Ambulance ${samuiKnowledge.emergency.ambulance}, Police ${samuiKnowledge.emergency.police}, Fire ${samuiKnowledge.emergency.fire}. Main Hospital: ${samuiKnowledge.emergency.mainHospital}.`;
    await ingestItem(emergencyContent, 'emergency', samuiKnowledge.emergency);

    // 6. Ingest Blog Posts
    for (const post of blogPosts) {
        const content = `Blog Post: ${post.title}. Excerpt: ${post.excerpt}. Content: ${post.content}`; // Embedding might truncate if too long, usually models handle 2k-8k tokens. 
        // For simplicity, we embed the whole chunk. Ideally we split long posts.
        await ingestItem(content, 'blog', { id: post.id, title: post.title, slug: post.slug });
    }

    console.log("Ingestion Complete.");
}

main();
