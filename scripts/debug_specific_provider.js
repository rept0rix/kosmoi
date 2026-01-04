import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('🔍 Searching for Starbeach and Soi Baan...');

    // Fetch Starbeach
    const { data: starbeach, error: err1 } = await supabase
        .from('service_providers')
        .select('*')
        .ilike('business_name', '%Starbeach%');

    if (err1) console.error('Error fetching Starbeach:', err1);
    else console.log('\n[Starbeach Results]:', starbeach?.length);
    starbeach?.forEach(p => {
        console.log(`\nName: ${p.business_name}`);
        console.log(`Category: ${p.category}`);
        console.log(`Images:`, p.images);
    });

    // Fetch Soi Baan
    const { data: soibaan, error: err2 } = await supabase
        .from('service_providers')
        .select('*')
        .ilike('business_name', '%Soi Baan%');

    if (err2) console.error('Error fetching Soi Baan:', err2);
    else console.log('\n[Soi Baan Results]:', soibaan?.length);
    soibaan?.forEach(p => {
        console.log(`\nName: ${p.business_name}`);
        console.log(`Category: ${p.category}`);
        console.log(`Images:`, p.images);
    });
}

run();
