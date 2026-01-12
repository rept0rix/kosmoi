
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    const { error } = await supabase.from('push_subscriptions').select('*').limit(1);
    if (error) console.error("❌ Table check failed:", error.message);
    else console.log("✅ Table 'push_subscriptions' exists!");
}
inspect();
