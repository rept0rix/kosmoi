import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDuplicates() {
    console.log("🔎 Checking for duplicates in 'service_providers'...");

    // We can check duplication by google_place_id or exact name + location
    const { data, error } = await supabase.from('service_providers').select('id, business_name, google_place_id');

    if (error) {
        console.error("❌ Failed to fetch:", error.message);
        return;
    }

    const placeIdMap = new Map();
    const nameMap = new Map();
    let duplicates = 0;

    data.forEach(item => {
        // Check Google Place ID
        if (item.google_place_id) {
            if (placeIdMap.has(item.google_place_id)) {
                console.warn(`⚠️ Duplicate Place ID found: ${item.google_place_id} (${item.business_name})`);
                duplicates++;
            } else {
                placeIdMap.set(item.google_place_id, item.id);
            }
        }

        // Check Name (Loose check)
        const nameKey = item.business_name.toLowerCase().trim();
        if (nameMap.has(nameKey)) {
            // console.warn(`⚠️ Possible Name Duplicate: "${item.business_name}"`);
            // Identifying name duplicates is trickier, keeping it strict to Place ID for now as "Hard Duplicate"
        } else {
            nameMap.set(nameKey, item.id);
        }
    });

    if (duplicates === 0) {
        console.log("✅ No duplicates found (based on Google Place ID).");
    } else {
        console.log(`❌ Found ${duplicates} duplicates.`);
    }
}

checkDuplicates();
