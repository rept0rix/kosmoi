
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error("Missing env"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // Select 10 businesses that have google_place_id
    const { data, error } = await supabase
        .from('service_providers')
        .select('business_name, google_place_id, phone, website, opening_hours, google_reviews')
        .neq('google_place_id', null)
        .limit(10);

    if (error) { console.error(error); return; }

    console.log("Checking 10 random businesses with Google ID:");
    data.forEach(b => {
        console.log(`\nName: ${b.business_name}`);
        console.log(`Phone: ${b.phone || 'MISSING'}`);
        console.log(`Website: ${b.website || 'MISSING'}`);
        console.log(`Hours: ${b.opening_hours ? 'PRESENT (JSON)' : 'MISSING'}`);
        console.log(`Reviews: ${b.google_reviews && b.google_reviews.length > 0 ? `PRESENT (${b.google_reviews.length})` : 'MISSING'}`);
    });
}

checkData();
