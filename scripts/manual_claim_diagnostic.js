
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Try to get the service role key, fallback to anon (which might fail for admin.listUsers)
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("--- Users ---");
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });

    if (userError) {
        console.log("Admin API failed, trying public.users:", userError.message);
        const { data: publicUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);
        console.log(publicUsers);
    } else {
        const target = users.users.find(u => u.email && (u.email.includes('naor') || u.email.includes('admin') || u.email.includes('user')));
        if (target) {
            console.log(`🎯 FOUND USER: ${target.email} | ID: ${target.id}`);
        } else {
            console.log("Last 3 Users:", users.users.slice(0, 3).map(u => ({ email: u.email, id: u.id })));
        }
    }

    console.log("\n--- Recent Businesses (Last 24h) ---");
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: providers, error: provError } = await supabase
        .from('service_providers')
        .select('id, business_name, owner_id, status, created_at')
        .gt('created_at', oneDayAgo)
        .order('created_at', { ascending: false });

    if (provError) console.error(provError);
    else {
        if (providers.length === 0) console.log("No recent businesses found.");
        else {
            providers.forEach(p => {
                console.log(`🏠 [${p.status}] ${p.business_name} (Owner: ${p.owner_id || 'NONE'}) - ID: ${p.id}`);
            });
        }
    }
}

diagnose();
