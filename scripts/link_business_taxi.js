import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function linkBusiness() {
    const email = "na0ryank0@gmail.com";
    // ID for 'Island Taxi Service' found in previous step: c68630a9-e1ae-409d-8e2a-e0cfadfa3eff
    // Or I can verify it dynamically.

    const targetCriterias = [
        { column: 'business_name', value: 'Island Taxi Service' }
    ];

    for (const criteria of targetCriterias) {
        console.log(`Searching for ${criteria.value}...`);
        const { data: businesses } = await supabase.from('service_providers').select('*').eq(criteria.column, criteria.value);

        if (businesses && businesses.length > 0) {
            const business = businesses[0];
            console.log(`Updating '${business.business_name}' (${business.id}) to be owned by ${email}...`);

            const { error } = await supabase
                .from('service_providers')
                .update({ created_by: email, owner_id: '87fbda0b-46d9-44e9-a460-395ca941fd31' }) // user ID from previous log
                .eq('id', business.id);

            if (error) console.error("Update failed:", error);
            else console.log("✅ Success!");
        } else {
            console.warn("Not found.");
        }
    }
}

linkBusiness();
