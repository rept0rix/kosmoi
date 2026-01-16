import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log(`🌐 Connecting to ${supabaseUrl}...`);

const fetchMapLocations = async () => {
    try {
        // Mimic AdminService.getMapLocations fetch
        // select=id,business_name,latitude,longitude,email,category
        const url = `${supabaseUrl}/rest/v1/service_providers?select=id,business_name,latitude,longitude,email,category&order=created_at.desc&limit=10`;

        console.log(`📡 Fetching from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Success! Fetched ${data.length} records.`);

        if (data.length > 0) {
            console.log('📝 Sample Record:', data[0]);

            // Allow mapping test
            const mapped = data.map(item => ({
                ...item,
                current_lat: item.latitude,
                current_lng: item.longitude,
                contact_email: item.email,
                is_online: false
            }));

            console.log('🗺️  Mapped Record (for LiveMap):', mapped[0]);

            if (mapped[0].current_lat !== undefined && mapped[0].current_lng !== undefined) {
                console.log("✨ Verification PASSED: Data mapped correctly for Google Maps.");
            } else {
                console.error("❌ Verification FAILED: Mapping incorrect.");
            }
        } else {
            console.warn("⚠️  No data found, but request succeeded.");
        }

    } catch (e) {
        console.error("❌ Verification ERROR:", e);
    }
};

fetchMapLocations();
