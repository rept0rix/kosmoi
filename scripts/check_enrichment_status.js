
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase URL and Service Key are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatus() {
    console.log('🔍 Checking Enrichment Status...');

    const GENERIC_PATTERN = '%is a premier%Visit us for a great local experience%';

    // Count generic descriptions
    const { count: genericCount, error: countError } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true })
        .ilike('description', GENERIC_PATTERN);

    if (countError) {
        console.error('Error counting generic descriptions:', countError.message);
        return;
    }

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true });

    if (totalError) {
        console.error('Error counting total providers:', totalError.message);
        return;
    }

    const enrichedCount = totalCount - genericCount;
    const progress = totalCount > 0 ? (enrichedCount / totalCount) * 100 : 0;

    console.log(`📊 Enrichment Stats:`);
    console.log(`   - Total Providers: ${totalCount}`);
    console.log(`   - Pending Enrichment (Generic): ${genericCount}`);
    console.log(`   - Enriched (Custom): ${enrichedCount}`);
    console.log(`   - Progress: ${progress.toFixed(2)}%`);

    if (genericCount === 0) {
        console.log('✅ All descriptions enriched!');
    } else {
        console.log('⚠️  Enrichment incomplete.');
    }
}

checkStatus().catch(console.error);
