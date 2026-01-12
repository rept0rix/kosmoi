
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
    console.error("❌ Missing GEMINI_API_KEY in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Config
const AREAS = ['Chaweng', 'Lamai', 'Bophut', 'Fisherman\'s Village', 'Maenam'];
const CATEGORIES = [
    { key: 'restaurants', term: 'Restaurants' },
    { key: 'cafes', term: 'Cafes' },
    { key: 'massage_spa', term: 'Massage & Spa' },
    { key: 'yoga', term: 'Yoga Studios' },
    { key: 'cannabis_shops', term: 'Cannabis Dispensary' },
    { key: 'scooter_rental', term: 'Scooter Rental' }
];

async function seedCategory(area, category) {
    console.log(`🤖 Crawler: Scouting '${category.term}' in '${area}'...`);

    const prompt = `
    You are an expert local guide for Koh Samui, Thailand.
    List 5 REAL, POPULAR "${category.term}" in "${area}, Koh Samui".
    
    Return ONLY a JSON array. Each object must have:
    - business_name (string)
    - description (string, 1 short sentence)
    - category (string: use one of ['Eat', 'Drink', 'Visit', 'Relax', 'Service'])
    - sub_category (string: e.g., 'Italian', 'Thai', 'Massage')
    - location (string: just the area name, e.g., '${area}')
    - address (string, approximate)
    - contact_phone (string, realistic format +66...)
    - price_range (string: '$', '$$', '$$$', '$$$$')
    - lat (number, accurate latitude for this specific place)
    - lng (number, accurate longitude for this specific place)
    - images (array of strings: generate 1 realistic placeholder URL from 'https://source.unsplash.com/800x600/?${category.term.replace(' ', ',')}')
    - verified (boolean, set to false)

    JSON Array format only.
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const places = JSON.parse(text);

        if (!Array.isArray(places)) throw new Error("Not an array");

        console.log(`✨ Found ${places.length} places. Inserting...`);

        // Insert
        for (const place of places) {
            const { data, error } = await supabase
                .from('service_providers')
                .upsert({
                    business_name: place.business_name,
                    description: place.description,
                    category: place.category,
                    sub_category: place.sub_category,
                    location: place.location,
                    phone: place.contact_phone,
                    images: place.images,
                    verified: false,
                    status: 'active',
                    metadata: {
                        address: place.address,
                        price_range: place.price_range,
                        lat: place.lat,
                        lng: place.lng
                    }
                }, { onConflict: 'business_name' })
                .select();

            if (error) console.error(`❌ Failed to insert ${place.business_name}:`, error.message);
            else console.log(`   + Added: ${place.business_name}`);
        }

    } catch (e) {
        console.error(`❌ Error scanning ${area} - ${category.term}:`, e.message);
    }
}

async function run() {
    console.log("🕷️ Island Crawler (Generative) Started...");

    for (const area of AREAS) {
        for (const cat of CATEGORIES) {
            await seedCategory(area, cat);
            // Nap to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    console.log("✅ Crawl Complete.");
}

run();
