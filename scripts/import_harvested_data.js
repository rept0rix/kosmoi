
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DATA_FILE = path.join(__dirname, '../downloads/samui_map/harvested_data.json');

async function importData() {
    console.log("📥 Loading harvested data...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error(`❌ Data file not found: ${DATA_FILE}`);
        return;
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    const items = JSON.parse(rawData);

    console.log(`🚀 Importing ${items.length} items to Supabase...`);

    for (const item of items) {
        // Map fields
        const businessName = item.title || "Untitled Location";

        // Simple heuristic for category based on URL
        let category = 'other';
        if (item.url.includes('/cities/')) category = 'city';
        else if (item.url.includes('/beaches/')) category = 'beach';
        else if (item.url.includes('/temples/')) category = 'temple';
        else if (item.url.includes('/activities/')) category = 'activity';
        else if (item.url.includes('/dining/')) category = 'restaurant';
        else if (item.url.includes('/accomodations/')) category = 'hotel';

        const providerData = {
            business_name: businessName,
            description: item.description,
            category: category,
            status: 'active',
            verified: true,
            images: item.images || [],
            website: item.url,
            created_by: 'system_importer'
        };

        console.log(`📝 Upserting: ${businessName} [${category}]`);

        const { error } = await supabase
            .from('service_providers')
            .insert([providerData]); // Change to insert to avoid constraint error

        if (error) {
            console.error(`❌ Failed to import ${businessName}:`, error.message);
        }
    }

    console.log("\n✅ Import complete!");
}

const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
    console.log("🧪 DRY RUN MODE: No DB writes will be performed.");
    // Add logic for dry run if needed
} else {
    importData();
}
