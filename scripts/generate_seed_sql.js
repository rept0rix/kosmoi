import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../src/core/db/seed/providers.sql');

// Categories
const CATEGORIES = ['Hotels & Villas', 'Food & Dining', 'Taxis & Rentals', 'Professionals'];
const LOCATIONS = ['Chaweng', 'Lamai', 'Bophut', 'Maenam', 'Choeng Mon', 'Lipa Noi'];
const VIBES = ['Luxury', 'Budget', 'Family', 'Party', 'Romantic', 'Local', 'Beachfront', 'Sunset'];

// Helper to get random item from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Mock Data Generators by Category
const DATA_SETS = {
    'Hotels & Villas': [
        "Samui Paradise Resort", "The Library", "W Koh Samui", "Banyan Tree Samui", "Sala Samui",
        "Hansar Samui Resort", "Anantara Bophut", "Six Senses Samui", "Explorar Koh Samui", "OZO Chaweng",
        "Amari Koh Samui", "Lub d Koh Samui", "SocialTel Samui", "Kimpton Kitalay", "Centara Reserve",
        "Sheraton Samui", "Renaissance Koh Samui", "Melati Beach Resort", "Santiburi", "Four Seasons Resort"
    ],
    'Food & Dining': [
        "Jungle Club", "Coco Tam's", "Supattra Thai Dining", "Chez François", "Kob Thai",
        "Tree Tops Sky Dining", "Dining on the Rocks", "The Page", "Dr. Frogs", "Spirit House",
        "Sabienglae", "Kawin's Kitchen", "Green Bird", "Vikasa Life Cafe", "Hemingway's on the Beach",
        "Stacked Burger", "Prego Italian", "Namu", "Zzen", "Barracuda"
    ],
    'Taxis & Rentals': [
        "Samui Taxi Service", "NaviGo Samui", "Smack One", "Mr. Tu Auto Rental", "Samui Bike Rental",
        "Island Hopping Transfers", "VIP Van Samui", "Budget Car Rental", "Hertz Samui", "Sixt Rent A Car",
        "Samui Scooter", "Big Bike Rental", "Luxury Car Samui", "Airport Transfer Pros", "Safe Ride Samui",
        "Easy Rent Samui", "Full Moon Party Transfer", "Ferry Transfer Service", "Private Driver Samui", "Jeep Safari Rentals"
    ],
    'Professionals': [
        "Samui Law Firm", "Bangkok Hospital Samui", "Samui International Hospital", "Build Con Samui", "Samui Home Fix",
        "Island Electrician", "Pro Plumber Samui", "Samui IT Solutions", "Graphic Design Samui", "Digital Nomad Hub",
        "Samui Wedding Planner", "Luxury Events Samui", "Samui Visa Services", "Accounting Pros", "Samui Real Estate Agent",
        "Pool Maintenance Co", "Garden Design Samui", "Cleaning Services Samui", "Nanny Service Samui", "Pet Care Samui"
    ]
};

const generateProviders = (countPerCategory = 20) => {
    let sql = `-- Seed Data for Service Providers\n\n`;
    sql += `INSERT INTO service_providers (id, business_name, category, sub_category, location, description, phone, email, website, images, rating, review_count, price_level, open_status, vibes, created_at, updated_at, owner_id) VALUES\n`;

    const values = [];

    for (const [category, names] of Object.entries(DATA_SETS)) {
        names.forEach(name => {
            const id = crypto.randomUUID();
            const location = random(LOCATIONS);
            const vibe1 = random(VIBES);
            const vibe2 = random(VIBES);
            const vibes = `{${vibe1},${vibe2}}`;
            const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
            const reviewCount = randomInt(10, 500);
            const priceLevel = randomInt(1, 4); // 1 = $, 4 = $$$$
            const openStatus = random(['Open', 'Closed']);
            // Using placeholder images for now
            const mainImg = `https://source.unsplash.com/random/800x600/?${category.split(' ')[0]},samui,${vibe1}`;
            const images = `{"${mainImg}","https://source.unsplash.com/random/800x600/?interior","https://source.unsplash.com/random/800x600/?food"}`;
            const description = `The best ${category} experience in ${location}. Offering typical Samui vibes with a touch of ${vibe1} luxury. Come visit ${name} today!`;

            // Sub-category (Mock)
            let subCategory = 'General';
            if (category === 'Hotels & Villas') subCategory = random(['Resort', 'Villa', 'Hostel', 'Hotel']);
            if (category === 'Food & Dining') subCategory = random(['Thai', 'Italian', 'Seafood', 'Cafe']);
            if (category === 'Taxis & Rentals') subCategory = random(['Taxi', 'Car Rental', 'Bike Rental']);
            if (category === 'Professionals') subCategory = random(['Medical', 'Legal', 'Construction', 'Services']);


            values.push(`('${id}', '${name.replace(/'/g, "''")}', '${category}', '${subCategory}', '${location}', '${description.replace(/'/g, "''")}', '+66 12 345 6789', 'contact@${name.replace(/\s+/g, '').toLowerCase()}.com', 'https://${name.replace(/\s+/g, '').toLowerCase()}.com', '${images}', ${rating}, ${reviewCount}, ${priceLevel}, '${openStatus}', '${vibes}', NOW(), NOW(), 'system_seed')`);
        });
    }

    sql += values.join(',\n') + ';';
    return sql;
};

const seedContent = generateProviders();

// Ensure directory exists
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, seedContent);
console.log(`✅ Seed file generated at: ${OUTPUT_FILE}`);
