
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createLead() {
    console.log("Creating Luxury Villa Lead...");
    const { error, data } = await supabase.from('crm_leads').insert({
        business_type: 'Luxury Villa Inquiry',
        first_name: 'Sir Richard',
        email: 'richard@private-island.com',
        notes: JSON.stringify({
            note: 'Looking for a private estate for 2 weeks in Feb. Secluded. Budget no issue.',
            budget: 'Unlimited'
        }),
        status: 'new'
    }).select().single();

    if (error) console.error(error);
    else console.log("Lead created:", data);
}

createLead();
