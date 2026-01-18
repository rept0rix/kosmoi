
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTransport() {
    console.log("🔍 Verifying 'Transport Hub' Query Logic...");

    // The query used in TransportHub.jsx
    const { data, error } = await supabase
        .from('service_providers')
        .select('id, business_name, category, sub_category, super_category')
        .eq('super_category', 'travel')
        .in('category', ['taxis', 'car_rental', 'motorbike_rental', 'ferries', 'transport'])
        .eq('status', 'active');

    if (error) {
        console.error("❌ Query Failed:", error);
        return;
    }

    console.log(`✅ Total Transport Items Found: ${data.length}`);

    // Breakdown
    const breakdown = {};
    data.forEach(item => {
        breakdown[item.category] = (breakdown[item.category] || 0) + 1;
    });

    console.table(breakdown);

    if (data.length < 50) {
        console.error("⚠️  WARNING: Count seems low. Expected > 200 items based on previous analysis.");
    } else {
        console.log("🚀 SUCCESS: Transport Hub is populated!");
    }
}

verifyTransport();
