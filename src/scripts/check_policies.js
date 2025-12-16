
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (SERVICE ROLE KEY needed)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Checking Policies...');

    // Note: accessing pg_policies via postgrest requires permissions usually reserved or exposing the view.
    // If this fails, we assume we can't check easily.
    // But often service role can read it.

    // However, Supabase exposes 'pg_policies'? Maybe not directly via API.
    // Let's try RPC if available, or just standard query on information_schema (which doesn't show policies usually).
    // Actually, querying 'pg_policies' view directly via API often fails unless exposed.

    // Alternative: Try to Insert as Valid User and fail? We already did that.

    // Let's try to select from 'pg_policies' anyway.
    const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'crm_leads');

    if (error) {
        console.error('Error checking policies:', error.message);
    } else {
        console.log('Policies found for crm_leads:', data.length);
        data.forEach(p => console.log(`- ${p.policyname}: ${p.cmd} TO ${p.roles}`));
    }
}

checkPolicies();
