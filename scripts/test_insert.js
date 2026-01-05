
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Explicitly use the Service Role Key
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log(`Connecting to ${supabaseUrl}...`);

    const payload = {
        business_name: 'Test Insert Script',
        source_url: `test_${Date.now()}`,
        status: 'active'
    };

    console.log("Attempting INSERT...");
    const { data, error } = await supabase
        .from('service_providers')
        .insert([payload])
        .select();

    if (error) {
        console.error("❌ INSERT FAILED:", error);
    } else {
        console.log("✅ INSERT SUCCESS:", data);
        console.log("Cleaning up...");
        await supabase.from('service_providers').delete().eq('id', data[0].id);
        console.log("Cleanup done.");
    }
}

testInsert();
