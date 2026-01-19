
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Configuration
const BATCH_SIZE = 10; // Small batch for safety
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing credentials (Google API or Supabase)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Resolves the Google Places Photo URL to the final 'googleusercontent' URL
 * This prevents us from leaking our API key in the frontend and saves quota.
 */
async function resolveGooglePhotoUrl(photoReference) {
    const rawUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;

    try {
        // We ensure allowRedirects is false so we can catch the 'location' header
        // axios usually follows redirects, so we need to grab the final URL from the response or configuration
        const response = await axios.get(rawUrl, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400 // Accept 3xx
        });

        // If it's a redirect (which it should be)
        if (response.headers.location) {
            return response.headers.location;
        }
        return rawUrl; // Fallback
    } catch (error) {
        // If it followed redirects automatically, response.request.res.responseUrl might have it
        if (error.response && error.response.headers.location) {
            return error.response.headers.location;
        }
        // If axios followed it, we might just have the final URL in the error/response context if configured,
        // but simpler to just use maxRedirects:0
        console.warn('⚠️ Could not resolve direct photo URL:', error.message);
        return null;
    }
}

async function findPlacePhoto(businessName) {
    if (!businessName) return null;

    // Safety cleanup
    const safeName = businessName.replace(/[^\w\s]/gi, '');
    const query = `${safeName} Koh Samui`;

    try {
        // 1. Find Place ID
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
        const searchRes = await axios.get(searchUrl);

        if (!searchRes.data.results || searchRes.data.results.length === 0) {
            console.log(`🔸 No Google match for: "${businessName}"`);
            return null;
        }

        const place = searchRes.data.results[0];

        if (!place.photos || place.photos.length === 0) {
            console.log(`🔸 Found place but NO PHOTOS for: "${businessName}"`);
            return null;
        }

        // 2. Resolve first photo
        const reference = place.photos[0].photo_reference;
        const resolvedUrl = await resolveGooglePhotoUrl(reference);

        if (resolvedUrl) {
            return [resolvedUrl];
        }

    } catch (err) {
        console.error(`❌ Google API Error for "${businessName}":`, err.message);
    }
    return null;
}

async function enrichMissingImages() {
    console.log('🖼️ Starting Image Enrichment (Gap Filler)...');

    // 1. Get businesses with NO images
    // Based on schema, images is a JSONB array. 
    // We check for null or empty array '[]' (as string representation in jsonb)

    const { data: records, error } = await supabase
        .from('service_providers')
        .select('id, business_name, images')
        .or('images.is.null,images.eq.[]') // Syntax depend on Supabase DB version, usually works
        .limit(BATCH_SIZE);

    if (error) {
        console.error('❌ DB Fetch Error:', error);
        return;
    }

    if (!records || records.length === 0) {
        console.log('✅ No businesses found needing images (in this batch/limit).');
        return;
    }

    console.log(`🔍 Found ${records.length} businesses to check.`);

    let updatedCount = 0;

    for (const record of records) {
        console.log(`\nProcessing: ${record.business_name}...`);

        // Sanity check just in case
        if (record.images && Array.isArray(record.images) && record.images.length > 0) {
            console.log('  ⏭️ Skipped (Already has images)');
            continue;
        }

        const newImages = await findPlacePhoto(record.business_name);

        if (newImages) {
            console.log('  📸 Found Image:', newImages[0].substring(0, 50) + '...');

            // Update DB
            const { error: updateError } = await supabase
                .from('service_providers')
                .update({ images: newImages })
                .eq('id', record.id);

            if (updateError) {
                console.error('  ❌ Update Failed:', updateError.message);
            } else {
                console.log('  ✅ Saved to DB.');
                updatedCount++;
            }
        } else {
            console.log('  💨 No image found.');
        }

        // Polite delay
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n🎉 Batch Complete. Updated ${updatedCount} businesses.`);
}

enrichMissingImages();
