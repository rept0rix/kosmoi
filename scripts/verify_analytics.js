
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verifyAnalytics() {
    const { data, error } = await supabase
        .from('business_analytics')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ 'business_analytics' verification failed:", error.message);
    } else {
        console.log("✅ 'business_analytics' table verified!");
    }
}
verifyAnalytics();
