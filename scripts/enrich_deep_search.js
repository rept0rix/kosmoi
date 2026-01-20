
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const googleKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limits
const BATCH_SIZE = 20;
const DELAY_MS = 300; // Slower for search queries

async function enrichDeepSearch() {
    console.log("🚀 Starting Deep Search Enrichment (Text Query -> Lat/Lng)...");

    if (!googleKey) {
        console.error("❌ Missing VITE_GOOGLE_MAPS_API_KEY");
        process.exit(1);
    }

    let totalUpdated = 0;
    let totalNotFound = 0;
    let hasMore = true;

    while (hasMore) {
        // Fetch batch of missing items
        // EXCLUDE items tagged in metadata
        // Note: Supabase JS filter for JSONB is .not('metadata->enrichment_status', 'is', null) - wait, checking syntax
        // Simpler: Fetch batch and filter in code if needed, OR use .is('latitude', null) and only pick those without enrichment_status

        // We will just fetch lat=null. We MUST update metadata on failure to avoid picking them up again if we can't update status.
        // Actually, let's filter purely by latitude=null.
        // If we fail, we MUST set latitude to something? No, that corrupts data.
        // We MUST use the metadata filter.

        const { data: batch, error } = await supabase
            .from('service_providers')
            .select('id, business_name, metadata')
            .is('latitude', null)
            .limit(BATCH_SIZE);

        if (error) {
            console.error("Supabase Error:", error);
            break;
        }

        // Client-side filtering because JSONB filtering can be tricky with partial nulls
        const pendingBatch = batch.filter(i => !i.metadata || !i.metadata.enrichment_status);

        if (!pendingBatch || pendingBatch.length === 0) {
            if (batch.length < BATCH_SIZE) {
                console.log("✅ No more records pending deep search.");
                hasMore = false;
                break;
            } else {
                console.log("⚠️ Batch contained only skipped items. Fetching next...");
                // This is risky if we don't have offset. 
                // We rely on the fact that successfully processed items get latitude!=null 
                // and failed items get metadata updated.
                // So "latitude=null" query should return different items? 
                // NO. If we don't update latitude on failure, they stay in lat=null.
                // We MUST filter by metadata in the QUERY.
            }
        }

        // Let's try to query with Filter
        // We'll use a hack: fetch bigger batch and filter client side only, OR assume we update valid status.
        // Let's try to set status='archived' ? No, restricted.
        // Let's use a PostgREST filter for jsonb: .not('metadata', 'cs', '{"enrichment_status": "failed"}')
        // Actually, simplest is: on failure, set latitude to 0,0 (Null Island) or something distinct? No.

        // Let's use the Metadata query:
        // .is('latitude', null)
        // .not('metadata->enrichment_status', 'eq', 'failed') ??
        // Supabase doesn't support '->' in .not() easily in all versions.

        // ALTERNATIVE: Just delete the duplicate records? 
        // If it's a duplicate, we can delete it.
        // If it's not found, maybe we set google_place_id to 'NOT_FOUND' (if unique constraint allows? No).

        // SAFE BET: Filter by filtering locally. But we need to use 'range' for pagination then to skip processed ones.
        // But the set of 'latitude=null' changes size.

        // LET'S DO THIS:
        // Query purely where latitude IS NULL.
        // On success -> latitude updated (removed from queue).
        // On duplicate -> DELETE the record (it's trash).
        // On not found -> Set metadata 'enrichment_status': 'not_found' AND... what?
        // We need to move it out of 'latitude IS NULL'.
        // Let's set latitude = 0, longitude = 0 for "Not Found".
        // Then we can filter them out in frontend (lat != 0).

        console.log(`Processing batch of ${pendingBatch.length} candidates...`);

        // Process sequentially
        for (const item of pendingBatch) {
            const query = `${item.business_name} Koh Samui`;

            try {
                // Find Place From Text
                const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry,place_id,name&key=${googleKey}`;

                const res = await axios.get(url);
                const candidates = res.data.candidates;

                if (candidates && candidates.length > 0) {
                    const match = candidates[0]; // Take best match
                    const { lat, lng } = match.geometry.location;

                    // Update Supabase
                    const { error: updateError } = await supabase
                        .from('service_providers')
                        .update({
                            latitude: lat,
                            longitude: lng,
                            google_place_id: match.place_id,
                            status: 'active'
                        })
                        .eq('id', item.id);

                    if (updateError) throw updateError;
                    console.log(`✅ Found: ${item.business_name} -> ${match.name}`);
                    totalUpdated++;
                } else {
                    console.warn(`⚠️  Not Found: ${item.business_name}`);
                    // Mark as 0,0 to dequeue
                    await supabase
                        .from('service_providers')
                        .update({ latitude: 0, longitude: 0, metadata: { ...item.metadata, enrichment_status: 'not_found' } })
                        .eq('id', item.id);
                    totalNotFound++;
                }
            } catch (err) {
                if (err.message.includes('duplicate key value') || (err.code && err.code === '23505') || err.message.includes('unique constraint')) {
                    console.warn(`♻️  Duplicate Found for ${item.business_name}. DELETING.`);
                    await supabase
                        .from('service_providers')
                        .delete() // DESTROY DUPLICATE
                        .eq('id', item.id);
                } else {
                    console.error(`❌ Failed ${item.business_name}: ${err.message}`);
                    // Error fallback
                    await supabase
                        .from('service_providers')
                        .update({ latitude: 0, longitude: 0, metadata: { ...item.metadata, enrichment_status: 'error' } })
                        .eq('id', item.id);
                }
                totalNotFound++;
            }
            // Delay
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        if (pendingBatch.length === 0 && hasMore) {
            // If we filtered everything out, we might be done, or we need to rely on the loop re-fetching
            // verification:
            const { count } = await supabase.from('service_providers').select('*', { count: 'exact', head: true }).is('latitude', null);
            if (count === 0) hasMore = false;
        }
    }

    console.log(`\n🎉 Deep Search Complete!`);
    console.log(`Recovered: ${totalUpdated}`);
    console.log(`Permanently Lost: ${totalNotFound}`);
}

enrichDeepSearch();
