import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Gemini
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ Missing PEM_GEMINI_API_KEY in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Use available model from diagnostics
const modelName = "gemini-2.0-flash-exp";
const model = genAI.getGenerativeModel({ model: modelName });

async function generateAndSeedEvents() {
    console.log("🤖 Event Scraper Agent: Starting generation...");

    const prompt = `
    You are an expert local guide for Koh Samui, Thailand.
    Generate 10 realistic, high-quality "upcoming events" for Koh Samui for the next 30 days.
    Include a mix of:
    - Night Markets (Fisherman's Village, Lamai)
    - Beach Parties (Ark Bar, Full Moon Party concepts)
    - Cultural Events (Temple fairs)
    - Wellness/Yoga classes
    - Live Music / Jazz nights

    Return ONLY a JSON array. Do not include markdown code blocks.
    Each object must have:
    - title (string)
    - description (string, engaging)
    - category (string: 'Nightlife', 'Culture', 'Market', 'Wellness', 'Music', 'Food')
    - start_time (ISO 8601 DateTime string, explicitly set to upcoming dates in 2024/2025)
    - end_time (ISO 8601 DateTime string, 2-4 hours after start)
    - location_name (string, real place name)
    - location_lat (number, approximate latitude)
    - location_lng (number, approximate longitude)
    - source_url (string, can be 'https://kosmoi.com')
    - is_verified (boolean, true)

    JSON Array format:
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const events = JSON.parse(text);

        if (!Array.isArray(events)) {
            throw new Error("AI response is not an array");
        }

        console.log(`✨ Generated ${events.length} events. Inserting into Supabase...`);

        // Insert into Supabase
        const { data, error } = await supabase
            .from('events')
            .upsert(events, { onConflict: 'title, start_time' }) // Assuming a composite constraint or just strictly inserting.
            // If no unique constraint exists on title/start_time, this might duplicate. 
            // Better to just insert for now or clear old ones if this was a refresh script.
            // For safety, let's just insert validation.
            .select();

        if (error) {
            console.error("❌ Database Error:", error.message);
        } else {
            console.log(`✅ Successfully inserted/updated ${data.length} events.`);
            data.forEach(e => console.log(`   - ${e.title} @ ${e.location_name}`));
        }

    } catch (e) {
        console.error("❌ Error generating events:", e);
    }
}

generateAndSeedEvents();
