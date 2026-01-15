
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
    console.log(`🌍 Checking DB: ${process.env.VITE_SUPABASE_URL}`);

    // Check Users
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) console.error("❌ Auth Error:", userError.message);
    else {
        console.log(`👤 Total Users: ${users.users.length}`);
        if (users.users.length > 0) {
            console.log("👉 First User ID:", users.users[0].id, "Email:", users.users[0].email);
        }
    }

    // Check Providers
    const { count: providers, error: provError } = await supabase.from('service_providers').select('*', { count: 'exact', head: true });
    if (provError) console.error("❌ Providers Error:", provError.message);
    else console.log(`wow Providers: ${providers}`);

    // Check Subs
    const { count: subs, error: subError } = await supabase.from('push_subscriptions').select('*', { count: 'exact', head: true });
    if (subError) console.error("❌ Push Subs Error:", subError.message);
    else console.log(`🔔 Push Subscriptions: ${subs}`);
}

checkStatus();
