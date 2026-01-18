
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping derived from src/components/subCategories.jsx
const CATEGORY_MAPPING = {
    // EAT
    'thai_food': 'eat',
    'cafes': 'eat',
    'bars': 'eat',
    'other': 'eat', // Fallback for generic restaurants
    'all_restaurants': 'eat',
    'western_food': 'eat',
    'seafood': 'eat',
    'street_food': 'eat',
    'fine_dining': 'eat',
    'breakfast': 'eat',
    'restaurants': 'eat',
    'restaurant': 'eat',
    'beach_clubs': 'eat', // Also enjoy, but primary eat/drink
    'Eat': 'eat',
    'Drink': 'eat',
    'Restaurants': 'eat',

    // FIX
    'car_mechanic': 'fix',
    'motorcycle_mechanic': 'fix',
    'plumber': 'fix',
    'electrician': 'fix',
    'cleaning': 'fix',
    'laundry': 'fix',
    'pool_maintenance': 'fix',
    'ac_repair': 'fix',
    'phone_repair': 'fix',
    'construction': 'fix',
    'gardener': 'fix',
    'pest_control': 'fix',
    'handyman': 'fix',
    'computer_repair': 'fix',

    // SHOP
    'convenience_stores': 'shop',
    'clothing': 'shop',
    'markets': 'shop',
    'all_shops': 'shop',
    'supermarkets': 'shop',
    'pharmacies': 'shop',
    'cannabis_shops': 'shop',
    'souvenirs': 'shop',
    'furniture': 'shop',
    'electronics': 'shop',

    // ENJOY
    'massage_spa': 'enjoy',
    'beauty': 'enjoy',
    'water_sports': 'enjoy',
    'beach_activities': 'enjoy',
    'cooking_classes': 'enjoy',
    'yoga': 'enjoy',
    'gyms': 'enjoy',
    'muay_thai': 'enjoy',
    'kids_activities': 'enjoy',
    'wellness': 'enjoy',
    'Relax': 'enjoy',

    // GO OUT
    'night_clubs': 'go_out',
    'live_music': 'go_out',
    'pubs': 'go_out',
    'nightlife': 'go_out',

    // TRAVEL (Transport & Stay)
    'hotels': 'travel',
    'hostels': 'travel',
    'accommodation': 'travel',
    'villas': 'travel',
    'hotel': 'travel',
    'resort': 'travel',

    'motorbike_rental': 'travel',
    'car_rental': 'travel',
    'ferries': 'travel',
    'island_tours': 'travel',
    'taxis': 'travel',
    'taxi': 'travel',
    'transport': 'travel',
    'activity': 'travel', // Generic tours often

    // HELP
    'clinics': 'help',
    'hospitals': 'help',
    'animal_rescue': 'help',

    // SERVICE (get_service)
    'money_exchange': 'get_service',
    'coworking': 'get_service',
    'real_estate': 'get_service',
    'photographers': 'get_service',
    'legal_accounting': 'get_service',
    'Service': 'get_service'
};

// Sub-Category Normalization (Fix singular/plural mismatches)
const SUB_CATEGORY_FIXES = {
    'taxi': 'taxis',
    'restaurant': 'restaurants',
    'hotel': 'hotels',
    'activity': 'island_tours',
    'transport': 'taxis', // Map generic transport to taxis for now
    'Eat': 'all_restaurants',
    'Drink': 'bars',
    'Relax': 'massage_spa',
    'Service': 'all_services'
};

async function fixCategories() {
    console.log("🛠️ Starting Category Fix...");

    // 1. Fetch all providers with missing or known bad super_category
    // For safety, we just fetch ALL and update if needed.
    // To save memory, we paginate.

    let processed = 0;
    let updated = 0;
    const step = 1000;
    let from = 0;
    let more = true;

    while (more) {
        // Fetch ID and Category fields only
        const { data: rows, error } = await supabase
            .from('service_providers')
            .select('id, category, sub_category, super_category')
            .range(from, from + step - 1);

        if (error) {
            console.error("Fetch Error:", error);
            break;
        }

        if (!rows || rows.length === 0) {
            more = false;
            break;
        }

        const updates = [];

        for (const row of rows) {
            const currentCat = row.category; // This is often the sub_category value in our messy data

            // Logic: The scraper often put 'thai_food' into 'category'.
            // Our DB schema likely expects:
            // super_category: 'eat'
            // category: 'thai_food' (or 'restaurants') -> This is confusing in codebase.
            // Let's align with subCategories.jsx:
            // "subCategoriesBySuperCategory" implies the values are sub-categories.

            // In the DB:
            // category -> seems to be holding values like 'thai_food', 'hotels'
            // sub_category -> seems to be holding similar or null
            // super_category -> largely null.

            const rawCat = currentCat || 'UNCATEGORIZED';
            let targetSuper = CATEGORY_MAPPING[rawCat];
            let targetSub = SUB_CATEGORY_FIXES[rawCat] || rawCat;

            // Heuristic for 'transport' items specifically
            if (rawCat === 'transport') {
                // Check business name or description if available? 
                // For now, map to taxis as safer default
                targetSuper = 'travel';
                targetSub = 'taxis';
            }

            // Only update if changes are needed
            if (targetSuper && (row.super_category !== targetSuper || row.category !== targetSub)) {
                updates.push({
                    id: row.id,
                    super_category: targetSuper,
                    category: targetSub, // Normalized
                    // sub_category: targetSub // Optional, keep redundant for safety if schema variations exist
                });
            }
        }

        // Perform Bulk Update (or batched single updates if bulk upsert is tricky without all fields)
        // upsert requires all non-nullable fields or default. update is safer by ID.
        // Parallelizing updates for speed.
        if (updates.length > 0) {
            console.log(`Processing batch ${from} - ${from + rows.length}. found ${updates.length} updates needed.`);

            // Batch them in groups of 50 for network sanity
            const batchSize = 50;
            for (let i = 0; i < updates.length; i += batchSize) {
                const chunk = updates.slice(i, i + batchSize);
                await Promise.all(chunk.map(u =>
                    supabase.from('service_providers').update({
                        super_category: u.super_category,
                        category: u.category // Updating category column to be the normalized sub-category key
                    }).eq('id', u.id)
                ));
            }
            updated += updates.length;
        }

        processed += rows.length;
        from += step;
        console.log(`Progress: ${processed} rows scanned.`);
    }

    console.log(`✅ ID: DONE. Scanned ${processed}, Updated ${updated} records.`);
}

fixCategories();
