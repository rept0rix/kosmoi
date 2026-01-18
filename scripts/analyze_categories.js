
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCategories() {
    console.log("📊 Analyzing Category Distribution...");

    // 1. Get total count
    const { count, error: countError } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error("Count Error:", countError);
    console.log(`Total Records: ${count}`);

    // 2. Get Category Breakdown
    // Since Supabase JS doesn't support easy "GROUP BY" without RPC, we'll fetch 'category' column and aggregate in JS.
    // For 5000 rows it's fast enough.

    let allData = [];
    let from = 0;
    const step = 1000;
    let more = true;

    while (more) {
        const { data: chunk, error } = await supabase
            .from('service_providers')
            .select('category, sub_category, super_category')
            .range(from, from + step - 1);

        if (error) {
            console.error("Fetch Error:", error);
            break;
        }

        if (chunk.length > 0) {
            allData = allData.concat(chunk);
            from += step;
        } else {
            more = false;
        }
    }

    const data = allData;


    const categoryStats = {};
    const subCategoryStats = {};
    const superCategoryStats = {}; // New

    let missingCategory = 0;
    let missingSuperCategory = 0; // New

    data.forEach(row => {
        const cat = row.category || 'UNCATEGORIZED';
        const sub = row.sub_category || 'UNCATEGORIZED';
        const sup = row.super_category || 'MISSING'; // New

        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        subCategoryStats[sub] = (subCategoryStats[sub] || 0) + 1;
        superCategoryStats[sup] = (superCategoryStats[sup] || 0) + 1;

        if (!row.category) missingCategory++;
        if (!row.super_category) missingSuperCategory++; // New
    });

    const report = {
        total: count,
        missing_category: missingCategory,
        missing_super_category: missingSuperCategory, // New
        unique_categories: Object.keys(categoryStats).length,
        super_categories: superCategoryStats, // New
        categories: categoryStats
    };

    console.log(JSON.stringify(report, null, 2));
}

analyzeCategories();
