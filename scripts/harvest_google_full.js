
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- CONFIGURATION COPY (to avoid import issues) ---
const CATEGORY_SEARCH_TERMS = {
    // EAT
    all_restaurants: 'restaurants',
    delivery: 'food delivery',
    thai_food: 'thai restaurant',
    western_food: 'western restaurant',
    cafes: 'cafe coffee shop',
    seafood: 'seafood restaurant',
    street_food: 'street food',
    fine_dining: 'fine dining restaurant',
    breakfast: 'breakfast brunch',
    bars: 'bar pub',
    beach_clubs: 'beach club',
    markets: 'night market food market',

    // FIX
    ac_repair: 'air conditioning repair',
    plumber: 'plumber',
    electrician: 'electrician',
    motorcycle_mechanic: 'motorcycle bike repair',
    car_mechanic: 'car repair mechanic',
    phone_repair: 'mobile phone repair',
    cleaning: 'cleaning service',
    laundry: 'laundry service',
    pool_maintenance: 'pool service',
    gardener: 'gardener',
    pest_control: 'pest control',
    construction: 'construction company',

    // SHOP
    all_shops: 'shopping mall',
    supermarkets: 'supermarket grocery',
    convenience_stores: 'convenience store 7-eleven',
    clothing: 'clothing store',
    pharmacies: 'pharmacy drug store',
    cannabis_shops: 'cannabis dispensary weed',
    electronics: 'electronics store com7',
    souvenirs: 'gift shop souvenir',
    furniture: 'furniture store home decor',

    // ENJOY
    massage_spa: 'massage spa',
    yoga: 'yoga studio',
    gyms: 'gym fitness center',
    muay_thai: 'muay thai gym',
    water_sports: 'water sports jet ski',
    cooking_classes: 'cooking class',
    beach_activities: 'beach club',
    kids_activities: 'kids playground indoor playground',

    // GO OUT
    night_clubs: 'night club',
    live_music: 'live music bar',
    pubs: 'pub',

    // TRAVEL
    motorbike_rental: 'motorbike rental scooter rental',
    car_rental: 'car rental',
    taxis: 'taxi service transport',
    ferries: 'ferry pier',
    island_tours: 'tour agency travel agency',
    hotels: 'hotel resort',
    villas: 'villa rental',
    hostels: 'hostel backpackers',

    // HELP
    hospitals: 'hospital',
    clinics: 'medical clinic',
    animal_rescue: 'veterinary clinic animal rescue',

    // GET SERVICE
    money_exchange: 'currency exchange money changer',
    real_estate: 'real estate agency property agent',
    coworking: 'coworking space',
    photographers: 'photographer studio',
    legal_accounting: 'law firm accounting firm',
    beauty: 'beauty salon hair salon nail'
};

const CRAWLER_AREAS = [
    'Chaweng',
    'Lamai',
    'Bophut',
    'Fisherman\'s Village',
    'Maenam',
    'Nathon',
    'Bang Rak',
    'Choeng Mon',
    'Lipa Noi',
    'Taling Ngam',
    'Hua Thanon'
];
// ----------------------------------------------------

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error("❌ GOOGLE_MAPS_API_KEY environment variable is missing!");
    process.exit(1);
}

const BASE_DIR = path.join(__dirname, '../downloads/google_full');
const IMAGES_DIR = path.join(BASE_DIR, 'images');
const DATA_FILE = path.join(BASE_DIR, 'data.json');

// Ensure directories
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// State
const PROCESSED_IDS = new Set();
let RESULTS = [];

// Load existing state if restart
if (fs.existsSync(DATA_FILE)) {
    try {
        const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        if (Array.isArray(existingData)) {
            RESULTS = existingData;
            RESULTS.forEach(item => {
                if (item.place_id) PROCESSED_IDS.add(item.place_id);
            });
            console.log(`📦 Loaded ${RESULTS.length} existing items.`);
        }
    } catch (e) {
        console.error("⚠️ Could not load existing data, starting fresh.");
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function downloadPhoto(photoReference, filenamePrefix) {
    const maxWidth = 800;
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;

    try {
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        const filename = `${filenamePrefix}_${photoReference.substring(0, 8)}.jpg`;
        const filepath = path.join(IMAGES_DIR, filename);

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filename));
            writer.on('error', reject);
        });
    } catch (err) {
        return null;
    }
}

async function searchPlaces(query, pageToken = null) {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    if (pageToken) {
        url += `&pagetoken=${pageToken}`;
    }

    try {
        const { data } = await axios.get(url);
        return data;
    } catch (err) {
        console.error(`❌ Search API Error: ${err.message}`);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Operation Omniscient (Full Island Harvest)...");

    // Iterate Areas
    for (const area of CRAWLER_AREAS) {
        console.log(`\n📍 Scanning Area: ${area}`);

        // Iterate Categories
        for (const [catKey, catTerm] of Object.entries(CATEGORY_SEARCH_TERMS)) {
            console.log(`  🔎 category: ${catTerm}...`);

            const query = `${catTerm} in ${area} Koh Samui`;
            let nextPageToken = null;
            let pageCount = 0;

            do {
                // Rate limit (Google requires delay for next page token availability)
                if (nextPageToken) await delay(2000);

                const data = await searchPlaces(query, nextPageToken);

                if (!data || data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                    console.error(`    ⚠️ API Status: ${data?.status}`);
                    break;
                }

                if (data.results) {
                    for (const place of data.results) {
                        if (PROCESSED_IDS.has(place.place_id)) continue;
                        PROCESSED_IDS.add(place.place_id);

                        const item = {
                            place_id: place.place_id,
                            name: place.name,
                            address: place.formatted_address,
                            types: place.types,
                            rating: place.rating,
                            user_ratings_total: place.user_ratings_total,
                            geometry: place.geometry,
                            business_status: place.business_status,
                            discovery_area: area,
                            discovery_category: catKey,
                            images: []
                        };

                        // Download Images
                        if (place.photos && place.photos.length > 0) {
                            // Download max 3
                            const photosToDownload = place.photos.slice(0, 3);
                            const prefix = place.name.substring(0, 10).replace(/[^a-z0-9]/gi, '_');

                            for (const photo of photosToDownload) {
                                const f = await downloadPhoto(photo.photo_reference, prefix);
                                if (f) item.images.push(f);
                            }
                        }

                        RESULTS.push(item);
                        process.stdout.write('+'); // Progress tick
                    }
                }

                nextPageToken = data.next_page_token;
                pageCount++;

                // Max 3 pages per search (60 results) usually suffices for specific area/cat
                if (pageCount >= 3) nextPageToken = null;

                // Save periodically
                if (RESULTS.length % 20 === 0) {
                    fs.writeFileSync(DATA_FILE, JSON.stringify(RESULTS, null, 2));
                }

            } while (nextPageToken);

            console.log(` (Total: ${RESULTS.length})`);
            await delay(1000); // Politeness between categories
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(RESULTS, null, 2));
    console.log(`\n🎉 Mission Complete. Total items harvested: ${RESULTS.length}`);
}

run();
