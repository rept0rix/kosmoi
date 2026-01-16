
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { samuiKnowledge } from "../src/data/samuiKnowledge.js";
import { blogPosts } from "../src/data/blogPosts.js";

dotenv.config();

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
    console.error("Missing required environment variables.");
    console.log("URL:", !!SUPABASE_URL);
    console.log("SERVICE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
    console.log("GEMINI_KEY:", !!GEMINI_API_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbedding(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        console.error("Embedding error:", e);
        throw e;
    }
}

async function ingestItem(content, category, metadata) {
    try {
        console.log(`Processing: ${category} - ${metadata.title || metadata.name || 'Unknown'}`);
        // Create embedding
        const embedding = await generateEmbedding(content);

        // Check if exists to avoid dupes (simple check by exact content or metadata ID if possible, here simplified)
        // ideally we use an ID.

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
    console.log("Starting Knowledge Ingestion (Node.js)...");

    // Clear existing data to avoid duplicates/bad data
    console.log("Clearing existing knowledge base...");
    const { error: deleteError } = await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (deleteError) console.error("Error clearing DB:", deleteError);
    else console.log("DB Cleared.");

    // 1. Ingest Beaches
    if (samuiKnowledge.beaches) {
        for (const beach of samuiKnowledge.beaches) {
            const content = `Beach: ${beach.name}. Vibe: ${beach.vibe}. Best For: ${beach.bestFor}. Description: ${beach.description}. Tips: ${beach.tips}`;
            await ingestItem(content, 'beaches', beach);
        }
    }

    // 2. Ingest Transport
    if (samuiKnowledge.transport) {
        for (const [key, transport] of Object.entries(samuiKnowledge.transport)) {
            const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
            const content = `Transport: ${name}. Description: ${transport.description}. Price: ${transport.priceRange}. Tips: ${transport.tips}`;
            await ingestItem(content, 'transport', { name, ...transport });
        }
    }

    // 3. Ingest Culture
    if (samuiKnowledge.culture) {
        const cultureContent = `Samui Culture: Temples - ${samuiKnowledge.culture.temples} Greeting - ${samuiKnowledge.culture.greeting} Feet - ${samuiKnowledge.culture.feet} Head - ${samuiKnowledge.culture.head}`;
        await ingestItem(cultureContent, 'culture', { name: "General Culture", ...samuiKnowledge.culture });
    }

    // 4. Ingest Activities
    if (samuiKnowledge.activities) {
        for (const activity of samuiKnowledge.activities) {
            const content = `Activity: ${activity.name} (${activity.type}). Description: ${activity.description}. Tips: ${activity.tips}`;
            await ingestItem(content, 'activities', activity);
        }
    }

    // 5. Ingest Emergency
    if (samuiKnowledge.emergency) {
        const emergencyContent = `Emergency Numbers Samui: Tourist Police ${samuiKnowledge.emergency.touristPolice}, Ambulance ${samuiKnowledge.emergency.ambulance}, Police ${samuiKnowledge.emergency.police}, Fire ${samuiKnowledge.emergency.fire}. Main Hospital: ${samuiKnowledge.emergency.mainHospital}.`;
        await ingestItem(emergencyContent, 'emergency', samuiKnowledge.emergency);
    }

    // 6. Ingest Blog Posts
    if (blogPosts) {
        for (const post of blogPosts) {
            const content = `Blog Post: ${post.title}. Excerpt: ${post.excerpt}. Content: ${post.content}`;
            await ingestItem(content, 'blog', { id: post.id, title: post.title, slug: post.slug });
        }
    }

    console.log("Ingestion Complete.");
}

main();
