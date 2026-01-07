import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

// Create a client with the SERVICE ROLE key for setup
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reproduce() {
    console.log("Setting up reproduction env...");
    const timestamp = Date.now();
    const email = `repro_${timestamp}@test.com`;
    const password = 'password123';

    // 1. Create User
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    if (userError) throw userError;
    console.log(`User created: ${user.id}`);

    // 2. Create Business & Invite
    const { data: business } = await supabaseAdmin.from('service_providers')
        .insert({ business_name: `Repro Biz ${timestamp}`, status: 'pending' })
        .select()
        .single();

    const token = nanoid(32);
    await supabaseAdmin.from('invitations').insert({
        service_provider_id: business.id,
        token: token,
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString()
    });
    console.log(`Token created: ${token}`);

    // 3. Authenticate as the NEW USER (simulating frontend)
    const supabaseClient = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data: { session }, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    if (loginError) throw loginError;
    console.log("Logged in as user.");

    // 4. Call the RPC (Exact same call as Frontend)
    console.log("Calling claim_business RPC...");
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('claim_business', {
        token_input: token
    });

    if (rpcError) {
        console.error("RPC ERROR:", rpcError);
    } else {
        console.log("RPC SUCCESS:", rpcData);
    }

    // 5. Verify DB
    const { data: check } = await supabaseAdmin.from('service_providers')
        .select('*')
        .eq('id', business.id)
        .single();

    console.log(`Final Provider Owner: ${check.owner_id}`);
    console.log(`Final Provider Status: ${check.status}`);
}

reproduce().catch(e => console.error(e));
