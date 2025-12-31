
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HARVEST_FILE = path.join(__dirname, '../downloads/samui_map/harvested_data.json');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ingestData() {
    console.log('🏗️ Starting Ingestion Process...');

    if (!fs.existsSync(HARVEST_FILE)) {
        console.error(`❌ Harvest file not found at: ${HARVEST_FILE}`);
        console.log('💡 Tip: Did you pull the data from the Ghost Machine?');
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(HARVEST_FILE, 'utf-8'));
    console.log(`📦 Loaded ${rawData.length} items from JSON.`);

    let successCount = 0;
    let failCount = 0;

    for (const item of rawData) {
        // Map fields
        // Note: 'content_snippet' from crawler becomes 'description'
        // 'images' need to be uploaded or referenced. For now, we reference known downloads relative path if we host them, 
        // but for simplicity in Batch 1, we might just store the array of filenames.

        // Cleaning Phone Number (basic)
        let phone = extractPhone(item.description);

        const payload = {
            business_name: item.title,
            description: item.content_snippet,
            location: 'Koh Samui', // Default, as crawler doesn't extract specific address yet
            category: guessCategory(item.url),
            source_url: item.url,
            images: item.images, // JSON array of filenames
            status: 'active',
            verified: false,
            // Logic to prevent dupes handled by upsert on a unique key if exists, 
            // but we don't have a unique key other than maybe business_name which is risky.
            // Using google_place_id as NULL for now (this source isn't Google Maps)
            imported_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('service_providers')
            .upsert(payload, { onConflict: 'business_name' }) // simplistic dedup
            .select();

        if (error) {
            console.error(`❌ Failed to insert: ${item.title}`, error.message);
            failCount++;
        } else {
            // console.log(`✅ Ingested: ${item.title}`); // Verbose
            successCount++;
        }

        if (successCount % 10 === 0) process.stdout.write('.');
    }

    console.log(`\n\n🎉 Ingestion Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

function extractPhone(text) {
    // Basic regex for Thai mobile/landline
    const match = text.match(/0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}/);
    return match ? match[0] : null;
}

function guessCategory(url) {
    if (url.includes('restaurant')) return 'restaurants';
    if (url.includes('hotel') || url.includes('resort')) return 'accommodation';
    if (url.includes('villa')) return 'villas';
    return 'other';
}

ingestData();
