
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createLead() {
    console.log("Creationg mock lead...");
    const { error, data } = await supabase.from('crm_leads').insert({
        business_type: 'Boat Rental Request',
        first_name: 'Captain Test',
        email: 'test@kosmoi.com',
        notes: JSON.stringify({ note: 'This is an automated test lead.' }),
        status: 'new'
    }).select().single();

    if (error) console.error(error);
    else console.log("Lead created successfully:", data);
}

createLead();
