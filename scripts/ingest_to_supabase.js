
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

    // Ensure bucket exists ONCE at startup
    console.log("🪣 Checking storage bucket...");
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets.find(b => b.name === 'provider-images')) {
            console.log("   Creating 'provider-images' bucket...");
            await supabase.storage.createBucket('provider-images', { public: true });
        }
    } catch (e) {
        console.warn("   ⚠️ Bucket check failed (might already exist):", e.message);
    }

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

        // Check existence by Google Place ID
        let { data: existing } = await supabase
            .from('service_providers')
            .select('id, images, google_place_id')
            .eq('google_place_id', item.place_id)
            .maybeSingle();

        // If not found by ID, check by Name (legacy merge)
        if (!existing) {
            const { data: existingByName } = await supabase
                .from('service_providers')
                .select('id, images, google_place_id')
                .ilike('business_name', item.name) // Use ilike for safety
                .maybeSingle();

            if (existingByName) existing = existingByName;
        }

        console.log(`\n${progress} Processing: ${item.name} ${existing ? '(Update)' : '(New)'}`);

        // Upload First Image (If needed)
        // We upload if: New Record OR Existing has no images
        let imageUrl = null;
        const needsImage = !existing || !existing.images || existing.images.length === 0;

        if (needsImage && item.images && item.images.length > 0) {
            process.stdout.write('  📸 Uploading image... ');
            imageUrl = await uploadImage(item.place_id, item.images[0]);
            console.log(imageUrl ? '✅' : '❌');
        } else if (existing && existing.images && existing.images.length > 0) {
            // Keep existing image if we didn't upload a new one
            // actually, we might want to overwrite if the new one is better?
            // For now, assume if it has an image, we leave it (speed).
            imageUrl = existing.images[0];
        }

        const superCat = getSuperCategory(item.discovery_category);
        const row = {
            business_name: item.name,
            category: item.discovery_category, // Consider mapping this dynamically?
            sub_category: item.discovery_category,
            super_category: superCat,
            description: `${item.types ? item.types.slice(0, 3).join(', ') : ''} (Imported from Google)`,
            location: item.address,
            // phone: null, // Don't overwrite contact info if it exists?
            // website: null,
            average_rating: item.rating || 0,
            status: 'active', // Ensure active
            verified: true,
            google_place_id: item.place_id,
            images: imageUrl ? [imageUrl] : (existing?.images || []),
            updated_at: new Date().toISOString()
        };

        let error;
        if (existing) {
            const { error: updateError } = await supabase
                .from('service_providers')
                .update(row)
                .eq('id', existing.id);
            error = updateError;
        } else {
            row.created_at = new Date().toISOString();
            const { error: insertError } = await supabase.from('service_providers').insert(row);
            error = insertError;
        }

        if (error) {
            console.error(`  ❌ Failed: ${error.message}`);
        } else {
            console.log("  ✅ Saved");
            successCount++;
        }
    }

    console.log(`\n🎉 Ingestion Complete.`);
    console.log(`   Added: ${successCount}`);
    console.log(`   Skipped (Exists): ${skipCount}`);
}

run();
