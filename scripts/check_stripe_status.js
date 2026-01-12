
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStripeStatus() {
    const { data, error } = await supabase
        .from('service_providers')
        .select('id, business_name, stripe_account_id, stripe_status')
        .not('stripe_status', 'is', null);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} providers with Stripe status:`);
        data.forEach(p => console.log(`- ${p.business_name}: ${p.stripe_status} (${p.stripe_account_id})`));
    }
}

checkStripeStatus();
