
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const serviceClient = createClient(url, serviceKey);
const anonClient = createClient(url, anonKey);

async function check() {
    console.log("🔍 Checking 'service_providers' visibility...");

    // 1. Check as Service Role (GOD MODE)
    const { count: adminCount, error: adminError } = await serviceClient
        .from('service_providers')
        .select('*', { count: 'exact', head: true });

    if (adminError) console.error("Admin Error:", adminError);
    else console.log(`👑 Admin (Service Role) sees: ${adminCount} rows`);

    // 2. Check as Anon (Public)
    const { count: anonCount, error: anonError } = await anonClient
        .from('service_providers')
        .select('*', { count: 'exact', head: true });

    if (anonError) console.error("Anon Error:", anonError);
    else console.log(`👻 Anon (Public) sees:       ${anonCount} rows`);

    // 3. Check for specific Mock Lead
    const { data: mockLeads } = await serviceClient
        .from('service_providers')
        .select('id, business_name, verified')
        .ilike('business_name', '%Test Bar%')
        .limit(5);

    console.log("\nRecent Mock Leads (Admin View):");
    console.table(mockLeads);
}

check();
