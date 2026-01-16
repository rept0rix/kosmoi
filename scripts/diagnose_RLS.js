
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

    if (anonError) console.error("Anon Error (Providers):", anonError);
    else console.log(`👻 Anon (Public) sees Providers: ${anonCount} rows`);

    // Check Invitations
    const { count: inviteCount, error: inviteError } = await anonClient
        .from('invitations')
        .select('*', { count: 'exact', head: true });

    if (inviteError) console.error("Anon Error (Invitations):", inviteError);
    else console.log(`👻 Anon (Public) sees Invitations: ${inviteCount} rows`);

    // Check Roadmap (Deep Debug)
    const { data: roadData, error: roadError } = await anonClient
        .from('roadmap_features')
        .select('*');

    if (roadError) {
        console.error("❌ Roadmap Error Object:", JSON.stringify(roadError, null, 2));
    } else {
        console.log(`✅ Roadmap Data Found: ${roadData?.length} items`);
        if (roadData?.length > 0) console.log("Sample:", roadData[0].title);
    }

    // 3. Inspect Columns
    const { data: sampleProps } = await serviceClient
        .from('service_providers')
        .select('*')
        .limit(1)
        .single();

    if (sampleProps) {
        console.log("\n📋 Table Columns:");
        console.log(Object.keys(sampleProps).join(', '));
    }
}

check();
