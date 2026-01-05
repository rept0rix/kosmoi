
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(query, category) {
    console.log(`\n🔎 Testing Search: "${query}" [Category: ${category}]`);

    let queryBuilder = supabase.from('service_providers').select('*');

    if (query) {
        queryBuilder = queryBuilder.or(`business_name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,sub_category.ilike.%${query}%,super_category.ilike.%${query}%,location.ilike.%${query}%`);
    }

    if (category) {
        queryBuilder = queryBuilder.ilike('category', `%${category}%`);
    }

    const { data, error } = await queryBuilder
        .order('verified', { ascending: false })
        .order('average_rating', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Search Error:", error);
        return;
    }

    if (!data.length) {
        console.warn("⚠️ No results found.");
        return;
    }

    console.log(`✅ Found ${data.length} results:`);
    data.forEach(p => {
        let imgUrl = "Placeholder";
        if (p.images && p.images.length > 0) {
            const rawImg = p.images[0];
            imgUrl = rawImg.startsWith('http') ? rawImg : `https://kgnuutevrytqrirgybla.supabase.co/.../${rawImg}`;
        }
        console.log(`- [${p.category}] ${p.business_name} (${p.average_rating}⭐)`);
        console.log(`  📸 Image: ${imgUrl}`);
    });
}

// Run Tests
await testSearch('Thai Food', null);
await testSearch(null, 'Hotel');
