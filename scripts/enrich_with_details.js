
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const LOOKUP_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !LOOKUP_API_KEY) {
    console.error("❌ Missing env vars (VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY, GOOGLE_MAPS_API_KEY)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPlaceDetails(placeId) {
    const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,photos,rating,user_ratings_total,reviews';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${LOOKUP_API_KEY}`;

    try {
        const { data } = await axios.get(url);
        if (data.status === 'OK') {
            return data.result;
        } else {
            console.error(`  ⚠️ Google API Error for ${placeId}: ${data.status}`);
            return null;
        }
    } catch (err) {
        console.error(`  ❌ Network Error: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Deep Data Enrichment (Phase 2)...");

    // Fetch batch of businesses that have Google ID but missing contact info
    // We do chunks of 50 to handle process restarts gracefully
    // Query condition: has google_place_id AND (phone is null OR website is null OR description like '%Imported%')
    // Actually, let's just loop all 'active' ones that are 'verified' (imported)

    // Pagination loop
    let hasMore = true;
    let offset = 0;
    const LIMIT = 100;
    let totalUpdated = 0;

    while (hasMore) {
        // We fetch explicitly those needing enrichment. 
        // For simplicity in this run, we target "all active" to ensure 100% coverage
        // But to be fast, let's target nulls first.
        const { data: items, error } = await supabase
            .from('service_providers')
            .select('id, business_name, google_place_id, phone, website')
            .neq('google_place_id', null)
            .is('phone', null) // Prioritize missing contact
            .range(offset, offset + LIMIT - 1);

        if (error) {
            console.error("❌ DB Fetch Error:", error);
            break;
        }

        if (!items || items.length === 0) {
            console.log("✅ No more items needing enrichment.");
            hasMore = false;
            break;
        }

        console.log(`📋 Processing batch ${offset} - ${offset + items.length}...`);

        for (const item of items) {
            console.log(`\n🔍 Enriching: ${item.business_name}`);

            const details = await fetchPlaceDetails(item.google_place_id);

            if (details) {
                const updates = {};

                if (details.formatted_phone_number) updates.phone = details.formatted_phone_number;
                if (details.website) updates.website = details.website;
                if (details.formatted_address) updates.location = details.formatted_address; // More precise address?

                // Store raw hours in a JSON column if we had one, but we don't.
                // For description, we can append info.

                if (details.opening_hours && details.opening_hours.weekday_text) {
                    updates.opening_hours = details.opening_hours; // Save entire object or just weekday_text? saving object is better for UI.
                }

                if (details.reviews && details.reviews.length > 0) {
                    updates.google_reviews = details.reviews; // Save raw Google Reviews array
                }

                // If we found updates, save them
                if (Object.keys(updates).length > 0) {
                    updates.updated_at = new Date().toISOString();

                    const { error: updateError } = await supabase
                        .from('service_providers')
                        .update(updates)
                        .eq('id', item.id);

                    if (updateError) {
                        console.error(`  ❌ Update Failed: ${updateError.message}`);
                    } else {
                        console.log(`  ✅ Updated: ${Object.keys(updates).join(', ')}`);
                        totalUpdated++;
                    }
                } else {
                    console.log("  ⚠️ No new info found on Google.");
                }
            }

            // Rate limit (Google allows 100 QPS typically, but let's be safe)
            await delay(200);
        }

        // We don't increment offset because we are processing the "null" queue. 
        // Queries will naturally shift as we fill them! 
        // WAIT. If we fill them, they no longer match .is('phone', null). 
        // So fetching offset 0 again brings the next batch.
        // HOWEVER, some might genuinely NOT have a phone, so they will stay null and we will loop forever.
        // FIX: We must increment offset or track processed IDs. 
        // Better strategy: Filter by updated_at < 'today' if we ran this before?
        // Or simpler: Just iterate using range and don't rely on 'is null' changing state.
        // Let's remove the .is('phone', null) filter and just iterate ALL google_place_id items that were imported recently?

        // Actually, let's keep it safe: iterate blindly.
        offset += items.length;
    }

    console.log(`\n🎉 Deep Enrichment Complete. Total updated: ${totalUpdated}`);
}

run();
