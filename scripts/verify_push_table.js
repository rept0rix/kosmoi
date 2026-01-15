
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verifyPushTable() {
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ 'push_subscriptions' table check failed:", error.message);
        // If it fails, we might need to run the migration manually via SQL query if possible or ask user
    } else {
        console.log("✅ 'push_subscriptions' table exists!");
    }
}
verifyPushTable();
