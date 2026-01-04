
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFilters() {
    console.log('--- Checking Dashboard Filters ---');

    // 1. Check verified status
    const { count: verifiedCount, error: vError } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('verified', true);

    if (vError) console.error('Verified Check Error:', vError);
    console.log(`Active & Verified Providers: ${verifiedCount}`);

    // 2. Check strict review filters
    const { data: strictData, error: sError } = await supabase
        .from('service_providers')
        .select('id, business_name, total_reviews, average_rating')
        .eq('status', 'active')
        .eq('verified', true)
        .gte('total_reviews', 3)
        .gte('average_rating', 4)
        .limit(5);

    if (sError) console.error('Strict Filter Error:', sError);

    if (!strictData || strictData.length === 0) {
        console.log('Result: 0 providers meet the "Top Rated" criteria (Reviews >= 3, Rating >= 4).');
    } else {
        console.log(`Result: Found ${strictData.length} providers matching strict criteria.`);
        console.log(strictData);
    }

    // 3. Show some stats of what we DO have
    const { data: sampleProps, error: spError } = await supabase
        .from('service_providers')
        .select('total_reviews, average_rating')
        .eq('status', 'active')
        .limit(10);

    if (sampleProps) {
        console.log('\nSample Stats (Active Providers):');
        sampleProps.forEach(p => console.log(`Reviews: ${p.total_reviews}, Rating: ${p.average_rating}`));
    }
}

checkFilters();
