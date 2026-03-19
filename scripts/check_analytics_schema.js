
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAnalytics() {
    console.log("🔍 Checking Analytics Table...");

    const { data, error } = await supabase
        .from('business_analytics')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ 'business_analytics' check failed:", error.message);
        // Check for 'events' table?
        const { data: events, error: evError } = await supabase.from('events').select('*').limit(1);
        if (evError) console.error("❌ 'events' check also failed:", evError.message);
        else console.log("⚠️ Found 'events' table instead.");
    } else {
        console.log("✅ 'business_analytics' table exists!");
        console.log("Columns:", data.length > 0 ? Object.keys(data[0]).join(", ") : "Table is empty");
    }
}

checkAnalytics();
