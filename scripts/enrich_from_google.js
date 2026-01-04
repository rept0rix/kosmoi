
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error("❌ GOOGLE_MAPS_API_KEY environment variable is missing!");
    process.exit(1);
}

const DATA_FILE = path.join(__dirname, '../downloads/samui_map/harvested_data.json');
const IMAGES_DIR = path.join(__dirname, '../downloads/samui_map/images');
const ENRICHED_FILE = path.join(__dirname, '../downloads/samui_map/enriched_data.json');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Helper to delay (rate limiting)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function downloadPhoto(photoReference, filenamePrefix) {
    const maxWidth = 800; // Good balance for quality/size
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const filename = `${filenamePrefix}_${photoReference.substring(0, 10)}.jpg`;
        const filepath = path.join(IMAGES_DIR, filename);

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filename));
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`  ⚠️ Failed to download photo: ${err.message}`);
        return null;
    }
}

async function findPlace(query) {
    // Text Search API
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    try {
        const { data } = await axios.get(url);
        if (data.status === 'OK' && data.results.length > 0) {
            return data.results[0]; // Best match
        }
        return null;
    } catch (err) {
        console.error(`  ⚠️ Google Search Error: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Google Maps Enrichment...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ Data file not found: ${DATA_FILE}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const json = JSON.parse(rawData);
    const items = json.data || [];

    console.log(`📋 Found ${items.length} businesses to enrich.`);

    const enrichedItems = [];
    let processingCount = 0;

    for (const item of items) {
        processingCount++;
        console.log(`\n[${processingCount}/${items.length}] Processing: ${item.title}`);

        // Construct search query (refined for Samui)
        // If address contains "Samui", use it, otherwise append "Koh Samui" to title
        let searchQuery = `${item.title} Koh Samui`;
        if (item.address && item.address.toLowerCase().includes('samui')) {
            searchQuery = `${item.title} ${item.address}`;
        }

        const place = await findPlace(searchQuery);

        if (place) {
            console.log(`  ✅ Found Google Place: ${place.name} (${place.place_id})`);

            // Enrich basic data
            item.google_place_id = place.place_id;
            item.rating = place.rating;
            item.user_ratings_total = place.user_ratings_total;
            item.geometry = place.geometry; // lat/lng
            item.google_types = place.types;
            item.formatted_address = place.formatted_address;

            // Enrich Images
            if (place.photos && place.photos.length > 0) {
                console.log(`  📸 Found ${place.photos.length} photos. Downloading top 3...`);
                item.images = item.images || []; // Reset or init

                // Download max 3 photos to be efficient but thorough
                const photosToDownload = place.photos.slice(0, 3);
                for (const photo of photosToDownload) {
                    const savedFilename = await downloadPhoto(photo.photo_reference, item.title.substring(0, 10).replace(/[^a-z0-9]/gi, '_'));
                    if (savedFilename) {
                        item.images.push(savedFilename);
                    }
                }
            } else {
                console.log("  ⚠️ No photos found in Google Place.");
            }
        } else {
            console.log("  ❌ Could not find on Google Maps.");
        }

        enrichedItems.push(item);

        // Save incrementally every 10 items
        if (processingCount % 10 === 0) {
            const intermediateOutput = { ...json, data: enrichedItems };
            fs.writeFileSync(ENRICHED_FILE, JSON.stringify(intermediateOutput, null, 2));
            console.log("  💾 Intermediate save.");
        }

        // Respect API rate limits (mild delay)
        await delay(200);
    }

    // Final Save
    const finalOutput = { ...json, data: enrichedItems };
    fs.writeFileSync(ENRICHED_FILE, JSON.stringify(finalOutput, null, 2));
    console.log(`\n🎉 Enrichment Complete! Enriched data saved to: ${ENRICHED_FILE}`);
}

run();
