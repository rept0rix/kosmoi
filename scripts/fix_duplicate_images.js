import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BAD_URL = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5';

async function run() {
    console.log(`🔍 Searching for providers with bad image: ${BAD_URL}`);

    // Fetch providers that HAVE images
    // Note: Supabase ILIKE with array column is tricky, easier to fetch all with known pattern or just iterate high risk ones.
    // We'll fetch all providers that have ANY images to be safe (or filtered likely candidates).
    // Actually, we can use `cs` (contains) for array, but for text array it's specific.
    // Let's just fetch all valid providers with check.

    // Page them to be safe
    let page = 0;
    const pageSize = 500;
    let totalFixed = 0;

    while (true) {
        const { data: providers, error } = await supabase
            .from('service_providers')
            .select('id, business_name, images')
            .not('images', 'is', null)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ Error fetching:', error);
            break;
        }

        if (!providers || providers.length === 0) break;

        console.log(`Processing batch ${page + 1}... (${providers.length} items)`);

        for (const p of providers) {
            if (Array.isArray(p.images)) {
                // Check if it has the bad image (fuzzy match or exact)
                const hasBadImage = p.images.some(img => typeof img === 'string' && img.includes('photo-1555396273'));

                if (hasBadImage) {
                    console.log(`⚠️  Found bad image in: ${p.business_name}`);

                    // Filter it out
                    const cleanImages = p.images.filter(img => typeof img === 'string' && !img.includes('photo-1555396273'));

                    // Update
                    const { error: updateErr } = await supabase
                        .from('service_providers')
                        .update({ images: cleanImages })
                        .eq('id', p.id);

                    if (updateErr) console.error(`   ❌ Failed to update ${p.business_name}`, updateErr);
                    else {
                        console.log(`   ✅ Fixed. Remaining images: ${cleanImages.length}`);
                        totalFixed++;
                    }
                }
            }
        }

        page++;
    }

    console.log(`\n🎉 Done! Total records fixed: ${totalFixed}`);
}

run();
