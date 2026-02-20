import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log("--- AUDITING SERVICE PROVIDERS ---");

    const { data: y, error: e1 } = await supabase
        .from('service_providers')
        .select('*')
        .ilike('name', '%yacht%');

    if (y && y.length > 0) {
        console.log("Found Yacht Providers:", JSON.stringify(y, null, 2));
    } else {
        console.log("No specific yacht providers found by name search.");
    }

    const { data: all, error: e2 } = await supabase
        .from('service_providers')
        .select('category')
        .limit(50);

    const categories = [...new Set(all?.map(p => p.category))];
    console.log("Existing categories:", categories);

    process.exit(0);
}

audit();
