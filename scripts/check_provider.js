
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Searching for 'Starbeach Cafe'...");
    const { data, error } = await supabase
        .from('service_providers')
        .select('id, business_name, images, category')
        .ilike('business_name', '%Starbeach Cafe%')
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Record found:");
        console.log(JSON.stringify(data, null, 2));
    }
}

check();
