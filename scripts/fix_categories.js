import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('🏗️  Fixing Categories...');

    // 1. Fix Restaurants/Cafes (currently Handyman/Other)
    const restaurantKeywords = ['Cafe', 'Coffee', 'Restaurant', 'Bar', 'Bistro', 'Dining', 'Kitchen', 'Food'];

    // We fetch ALL items that might need fixing to avoid complex OR logic in Supabase if slightly limited
    // Actually, we can just iterate keywords.

    let totalFixed = 0;

    for (const keyword of restaurantKeywords) {
        // Find items with this keyword in name, but WRONG category
        const { data: items } = await supabase
            .from('service_providers')
            .select('id, business_name, category')
            .ilike('business_name', `%${keyword}%`)
            .neq('category', 'restaurants'); // If it's not already correct

        if (items && items.length > 0) {
            console.log(`Found ${items.length} potental restaurants matching "${keyword}"...`);

            for (const item of items) {
                // Double check current category is weak
                if (['handyman', 'other', 'undefined', null].includes(item.category)) {
                    console.log(`   -> Fixing "${item.business_name}" (${item.category} -> restaurants)`);

                    const { error } = await supabase
                        .from('service_providers')
                        .update({ category: 'restaurants' })
                        .eq('id', item.id);

                    if (!error) totalFixed++;
                }
            }
        }
    }

    // 2. Fix Accommodation
    const hotelKeywords = ['Hotel', 'Resort', 'Villa', 'Bungalow', 'Hostel', 'Stay'];
    for (const keyword of hotelKeywords) {
        const { data: items } = await supabase
            .from('service_providers')
            .select('id, business_name, category')
            .ilike('business_name', `%${keyword}%`)
            .neq('category', 'accommodation');

        if (items && items.length > 0) {
            console.log(`Found ${items.length} potental accommodations matching "${keyword}"...`);
            for (const item of items) {
                if (['handyman', 'other', 'undefined', null].includes(item.category)) {
                    console.log(`   -> Fixing "${item.business_name}" (${item.category} -> accommodation)`);
                    const { error } = await supabase
                        .from('service_providers')
                        .update({ category: 'accommodation' })
                        .eq('id', item.id);
                    if (!error) totalFixed++;
                }
            }
        }
    }

    // 3. Fix Wellness
    const wellnessKeywords = ['Massage', 'Spa', 'Yoga', 'Wellness', 'Gym', 'Fitness'];
    for (const keyword of wellnessKeywords) {
        const { data: items } = await supabase
            .from('service_providers')
            .select('id, business_name, category')
            .ilike('business_name', `%${keyword}%`)
            .neq('category', 'wellness');

        if (items && items.length > 0) {
            for (const item of items) {
                if (['handyman', 'other', 'undefined', null].includes(item.category)) {
                    console.log(`   -> Fixing "${item.business_name}" (${item.category} -> wellness)`);
                    const { error } = await supabase
                        .from('service_providers')
                        .update({ category: 'wellness' })
                        .eq('id', item.id);
                    if (!error) totalFixed++;
                }
            }
        }
    }

    console.log(`\n🎉 Finished! Total categories fixed: ${totalFixed}`);
}

run();
