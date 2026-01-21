
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const googleKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limits
const BATCH_SIZE = 50;
const DELAY_MS = 200; // Increased delay to be safe

async function enrichLocations() {
    console.log("🚀 Starting Enrichment Blitz (Target: Google Place ID -> Lat/Lng)...");

    if (!googleKey) {
        console.error("❌ Missing VITE_GOOGLE_MAPS_API_KEY");
        process.exit(1);
    }

    let totalUpdated = 0;
    let totalFailed = 0;
    let hasMore = true;

    while (hasMore) {
        // Fetch batch of missing items
        // EXCLUDE items that we already marked as failed (status='review_needed')
        const { data: batch, error } = await supabase
            .from('service_providers')
            .select('id, google_place_id, business_name')
            .is('latitude', null)
            .not('google_place_id', 'is', null) // Only those with IDs
            .neq('status', 'review_needed') // CRITICAL: Don't process failed ones again
            .limit(BATCH_SIZE);

        if (error) {
            console.error("Supabase Error:", error);
            break;
        }

        if (!batch || batch.length === 0) {
            console.log("✅ No more records pending enrichment.");
            hasMore = false;
            break;
        }

        console.log(`Processing batch of ${batch.length}...`);

        // Process in parallel (with map)
        const promises = batch.map(async (item) => {
            try {
                // Fetch Details (Fields: geometry) - Basic Data SKU (Usually Free/Cheap)
                const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.google_place_id}&fields=geometry&key=${googleKey}`;

                const res = await axios.get(url);
                const result = res.data.result;

                if (result && result.geometry && result.geometry.location) {
                    const { lat, lng } = result.geometry.location;

                    // Update Supabase
                    const { error: updateError } = await supabase
                        .from('service_providers')
                        .update({
                            latitude: lat,
                            longitude: lng,
                            status: 'active' // Auto-activate
                        })
                        .eq('id', item.id);

                    if (updateError) throw updateError;
                    return true;
                } else {
                    console.warn(`⚠️  No geometry for ${item.business_name} (${item.google_place_id}) - Status: ${res.data.status}`);

                    // Mark as failed to remove from queue
                    await supabase
                        .from('service_providers')
                        .update({ status: 'review_needed' })
                        .eq('id', item.id);

                    return false;
                }
            } catch (err) {
                console.error(`❌ Failed ${item.business_name}: ${err.message}`);
                // Mark as failed to remove from queue
                await supabase
                    .from('service_providers')
                    .update({ status: 'review_needed' })
                    .eq('id', item.id);
                return false;
            }
        });

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r).length;
        totalUpdated += successCount;
        totalFailed += (batch.length - successCount);

        console.log(`Batch Complete. Success: ${successCount}, Failed: ${batch.length - successCount}`);

        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`\n🎉 Enrichment Complete!`);
    console.log(`Updated: ${totalUpdated}`);
    console.log(`Failed: ${totalFailed}`);
}

enrichLocations();
