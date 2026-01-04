
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// --- CONFIGURATION COPY (Category Mappings) ---
const subCategoriesBySuperCategory = {
    eat: ["all_restaurants", "delivery", "thai_food", "western_food", "cafes", "seafood", "street_food", "fine_dining", "breakfast", "bars", "beach_clubs", "markets"],
    fix: ["all_fixers", "ac_repair", "plumber", "electrician", "motorcycle_mechanic", "car_mechanic", "phone_repair", "cleaning", "laundry", "pool_maintenance", "gardener", "pest_control", "construction"],
    shop: ["all_shops", "supermarkets", "convenience_stores", "clothing", "pharmacies", "cannabis_shops", "electronics", "souvenirs", "furniture"],
    enjoy: ["all_activities", "massage_spa", "yoga", "gyms", "muay_thai", "water_sports", "cooking_classes", "beach_activities", "kids_activities"],
    go_out: ["all_events", "night_clubs", "live_music", "pubs", "shows"],
    travel: ["all_trips", "motorbike_rental", "car_rental", "taxis", "ferries", "island_tours", "hotels", "villas", "hostels"],
    help: ["hospitals", "clinics", "animal_rescue"],
    get_service: ["all_services", "money_exchange", "real_estate", "coworking", "photographers", "legal_accounting", "beauty"]
};

const getSuperCategory = (category) => {
    for (const [superCat, subCats] of Object.entries(subCategoriesBySuperCategory)) {
        if (subCats.includes(category)) return superCat;
    }
    return 'other';
};
// ------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Env vars provided at runtime
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const BASE_DIR = path.join(__dirname, '../downloads/google_full');
const DATA_FILE = path.join(BASE_DIR, 'data.json');
const IMAGES_DIR = path.join(BASE_DIR, 'images');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function uploadImage(placeId, filename) {
    if (!filename) return null;
    const localPath = path.join(IMAGES_DIR, filename);
    if (!fs.existsSync(localPath)) return null;

    try {
        const fileBuffer = fs.readFileSync(localPath);
        const storagePath = `collab/${placeId}_${Date.now()}.jpg`;

        const { data, error } = await supabase.storage
            .from('provider-images')
            .upload(storagePath, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        const { data: publicData } = supabase.storage
            .from('provider-images')
            .getPublicUrl(storagePath);

        return publicData.publicUrl;
    } catch (err) {
        console.error(`  ⚠️ Image upload failed: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Ingestion to Supabase...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error("❌ Data file not found.");
        process.exit(1);
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    let items = [];
    try {
        items = JSON.parse(rawData);
    } catch (e) {
        console.error("❌ Invalid JSON");
        process.exit(1);
    }

    console.log(`📋 Found ${items.length} items to process.`);

    let successCount = 0;
    let skipCount = 0;

    for (const [index, item] of items.entries()) {
        const progress = `[${index + 1}/${items.length}]`;

        // Check existence
        const { data: existing } = await supabase
            .from('service_providers')
            .select('id')
            .eq('google_place_id', item.place_id)
            .maybeSingle();

        if (existing) {
            process.stdout.write('.');
            skipCount++;
            continue;
        }

        console.log(`\n${progress} Importing: ${item.name}`);

        // Upload First Image
        let imageUrl = null;
        if (item.images && item.images.length > 0) {
            process.stdout.write('  📸 Uploading image... ');
            imageUrl = await uploadImage(item.place_id, item.images[0]);
            console.log(imageUrl ? '✅' : '❌');
        }

        // Prepare Row
        const superCat = getSuperCategory(item.discovery_category);
        const row = {
            business_name: item.name,
            category: item.discovery_category,
            super_category: superCat, // Important for filtering
            description: `${item.types ? item.types.slice(0, 3).join(', ') : ''} (Imported)`,
            location: item.address,
            phone: null, // Google Search usually doesn't return phone in the list view, details would
            website: null,
            average_rating: item.rating || 0,
            status: 'active', // Show immediately
            verified: true,   // Show as verified/safe
            google_place_id: item.place_id,
            metadata: {
                image_url: imageUrl,
                google_types: item.types,
                original_images: item.images,
                discovery_area: item.discovery_area
            },
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('service_providers').insert(row);

        if (error) {
            console.error(`  ❌ Insert Failed: ${error.message}`);
        } else {
            console.log("  ✅ Ingested");
            successCount++;
        }

        // Throttle slightly
        // await delay(50);
    }

    console.log(`\n🎉 Ingestion Complete.`);
    console.log(`   Added: ${successCount}`);
    console.log(`   Skipped (Exists): ${skipCount}`);
}

run();
