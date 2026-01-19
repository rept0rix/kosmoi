
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHealth() {
    console.log("🏥 Running Final Data Health Check...");

    // 1. Check for NULL super_category
    const { count: nullSuper, error: err1 } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .is('super_category', null);

    if (nullSuper > 0) {
        console.error(`❌ CRITICAL: Found ${nullSuper} records with NULL super_category!`);
    } else {
        console.log("✅ SUPER_CATEGORY INTEGRITY: 100% (No nulls)");
    }

    // 2. Check for NULL category
    const { count: nullCat, error: err2 } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .is('category', null);

    if (nullCat > 0) {
        console.warn(`⚠️  WARNING: Found ${nullCat} records with NULL category.`);
    } else {
        console.log("✅ CATEGORY INTEGRITY: 100% (No nulls)");
    }

    // 3. Super Category Breakdown
    const { data: allData } = await supabase
        .from('service_providers')
        .select('super_category');

    const distrib = {};
    allData.forEach(r => {
        const key = r.super_category || 'NULL';
        distrib[key] = (distrib[key] || 0) + 1;
    });

    console.log("\n📊 Super Category Distribution:");
    console.table(distrib);

    // 4. Transport Hub Specific Check
    const { count: transportCount } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .eq('super_category', 'travel')
        .in('category', ['taxis', 'car_rental', 'motorbike_rental', 'ferries']);

    console.log(`🚕 Transport Hub Candidates (Travel + [taxis, cars, bikes, boats]): ${transportCount}`);
}

checkHealth();
