
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

        // Insert (Try/Catch wrapper to handle duplicates gracefully)
        for (const place of places) {
            try {
                // First, check if it exists to avoid error spam (optional efficiency)
                const { data: existing } = await supabase
                    .from('service_providers')
                    .select('id')
                    .eq('business_name', place.business_name)
                    .maybeSingle();

                if (existing) {
                    console.log(`   ⚠️ Skiping ${place.business_name} (Already exists)`);
                    continue;
                }

                const { data, error } = await supabase
                    .from('service_providers')
                    .insert({
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
                    })
                    .select();

                if (error) {
                    // unexpected error
                    console.error(`❌ Failed (DB): ${place.business_name}:`, error.message);
                } else {
                    console.log(`   + Added: ${place.business_name}`);

                    // PROTOCOL 626: Notify Sales Coordinator
                    protocol.sendMessage('sales_coordinator', 'lead_found', `
New Lead Discovered: **${place.business_name}**
Location: ${place.location}
Category: ${place.category}
DB_ID: ${data[0].id}
                    `, { priority: 'high' });
                }

            } catch (err) {
                console.error(`❌ Failed (Script): ${place.business_name}:`, err.message);
            }
        }

    } catch (e) {
        console.error(`❌ Error scanning ${area} - ${category.term}:`, e.message);
    }
}

import AgentProtocol from './lib/agent_protocol.js';
const protocol = new AgentProtocol('island_crawler');

async function run() {
    console.log("🕷️ Island Crawler (Generative) Started...");
    protocol.updateStatus('WORKING', 'Scanning areas...');

    for (const area of AREAS) {
        for (const cat of CATEGORIES) {

            // Check Inbox for "STOP" command
            const inbox = protocol.readInbox();
            const stopMsg = inbox.find(m => m.type === 'STOP_CRAWLING');
            if (stopMsg) {
                console.log("🛑 Received STOP command.");
                protocol.updateStatus('IDLE', 'Stopped by command');
                return;
            }

            await seedCategory(area, cat);
            // Nap to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    console.log("✅ Crawl Complete.");
    protocol.updateStatus('IDLE', 'Waiting for next run');
}

run();
