
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error("Missing env"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function report() {
    // Get stats
    const { data, error } = await supabase
        .from('service_providers')
        .select('super_category, category, sub_category');

    if (error) { console.error(error); return; }

    const stats = {};
    data.forEach(r => {
        const key = `${r.super_category} -> ${r.category}`;
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log("Category Distribution:");
    Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .forEach(([k, v]) => console.log(`${k}: ${v}`));
}

report();
