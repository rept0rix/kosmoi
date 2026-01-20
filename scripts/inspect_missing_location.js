
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCandidates() {
    console.log("🕵️ Inspecting records pending enrichment...");

    const { data: candidates, error } = await supabase
        .from('service_providers')
        .select('id, business_name, location, google_place_id, source_url')
        .is('latitude', null) // Only those missing location
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${candidates.length} samples.`);

    console.log("\n--- Sample Record Analysis ---");
    candidates.forEach((c, i) => {
        console.log(`\n[${i + 1}] ${c.business_name}`);
        console.log(`    Location String: ${c.location || '(NULL)'}`);
        console.log(`    Place ID: ${c.google_place_id || '(NULL)'}`);
        console.log(`    Source: ${c.source_url || '(NULL)'}`);
    });

    // Check query coverage
    const hasAddress = candidates.filter(c => c.location && c.location.length > 5).length;
    const hasPlaceID = candidates.filter(c => c.google_place_id).length;

    console.log(`\n--- Strategy Insights (Sample Size: 20) ---`);
    console.log(`Has Text Address: ${hasAddress} / 20`);
    console.log(`Has Place ID: ${hasPlaceID} / 20`);

    if (hasPlaceID > 15) {
        console.log("✅ RECOMMENDATION: Use Google Places Details API (Cheaper/Faster if ID exists)");
    } else if (hasAddress > 15) {
        console.log("✅ RECOMMENDATION: Use Google Geocoding API (Address -> Lat/Lng)");
    } else {
        console.log("⚠️  CHALLENGE: Missing basic address. Must use Places Search API (Name -> Place -> Lat/Lng)");
    }
}

inspectCandidates();
