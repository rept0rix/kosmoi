
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load .env
const envPath = path.join(PROJECT_ROOT, '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    lines.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing Supabase Config");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function diagnose() {
    console.log("🔍 Diagnosing Service Providers...");

    // 1. Fetch all active providers
    const { data: providers, error } = await supabase
        .from('service_providers')
        .select('id, business_name, latitude, longitude, status')
        .eq('status', 'active');

    if (error) {
        console.error("❌ DB Query Failed:", error.message);
        return;
    }

    console.log(`📊 Found ${providers.length} Active Providers.`);

    let missingCoords = 0;
    let validCoords = 0;

    providers.forEach(p => {
        if (!p.latitude || !p.longitude) {
            console.log(`   ⚠️  MISSING DATA: ${p.business_name} (ID: ${p.id})`);
            missingCoords++;
        } else {
            validCoords++;
        }
    });

    console.log(`\n✅ Valid: ${validCoords}`);
    console.log(`❌ Invalid (No Lat/Long): ${missingCoords}`);

    if (missingCoords > 0) {
        console.log("\n💡 Recommendation: Run a geocoding script to fix missing coordinates.");
    } else {
        console.log("\n✅ Data looks correct. Issue might be Frontend or Google Maps API.");
    }
}

diagnose();
