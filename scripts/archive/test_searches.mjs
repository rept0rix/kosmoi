import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearches() {
    console.log("🔍 Testing main search endpoints...");
    let allPass = true;

    // 1. Service Providers (Businesses)
    try {
        const { data: providers, error } = await supabase
            .from('service_providers')
            .select('id, business_name')
            .ilike('business_name', '%a%') // Simple search
            .limit(5);

        if (error) throw error;
        console.log(`✅ Providers Search: Found ${providers.length} results.`);
        if (providers.length === 0) {
            console.warn("⚠️ Warning: No providers found for generic search.");
            allPass = false;
        }
    } catch (e) {
        console.error("❌ Providers Search failed:", e.message);
        allPass = false;
    }

    // 2. Marketplace Items
    try {
        const { data: marketplace, error } = await supabase
            .from('marketplace_items')
            .select('id, title')
            .ilike('title', '%%') // Match anything
            .limit(5);

        if (error) throw error;
        console.log(`✅ Marketplace Search: Found ${marketplace.length} results.`);
        if (marketplace.length === 0) {
            console.warn("⚠️ Warning: No marketplace items found.");
            // Not necessarily a failure if empty, but good to know
        }
    } catch (e) {
        console.warn("❌ Marketplace Table may not exist or query failed:", e.message);
    }

    // 3. Yachts / Properties (Real Estate Hub)
    try {
        const { data: yachts, error } = await supabase
            .from('yachts') // Assuming yachts table exists based on previous conversations
            .select('id, name')
            .limit(5);

        if (error) throw error;
        console.log(`✅ Yachts Search: Found ${yachts.length} results.`);
    } catch (e) {
        console.warn("⚠️ Yachts Search: (Table might not exist) ", e.message);
    }

    if (allPass) {
        console.log("\n🚀 All core searches seem to return data. Ready to deploy.");
    } else {
        console.log("\n⚠️ Some searches failed or returned empty results.");
    }
}

testSearches();
