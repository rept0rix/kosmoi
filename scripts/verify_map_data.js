
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyMapData() {
    console.log("🗺️  Verifying Map Data Logic...");

    // Simulate AdminService.getBusinesses
    const { data: providers, error } = await supabase
        .from('service_providers')
        .select('*');

    if (error) {
        console.error("❌ Fetch Error:", error);
        return;
    }

    console.log(`📊 Total Providers Fetched: ${providers.length}`);

    // Simulate LiveMap filtering
    const onlineProviders = providers.filter(p => p.is_online && (p.current_lat || p.latitude));
    const visibleProviders = providers.filter(p => (p.latitude && p.longitude) || (p.current_lat && p.current_lng));

    console.log(`🔵 Visible on Map (Has Location): ${visibleProviders.length}`);
    console.log(`🟢 Online Providers: ${onlineProviders.length}`);

    if (visibleProviders.length === 0) {
        console.error("❌ No visible providers found! Check latitude/longitude columns.");
    } else {
        console.log("✅ Map Logic Verified: Providers will show up.");
    }
}

verifyMapData();
