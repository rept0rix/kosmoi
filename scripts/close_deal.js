
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const LEAD_COMPANY = "Samui Elite Villas";

async function closeDeal() {
    console.log(`🏆 Closing Deal for ${LEAD_COMPANY}...`);

    // 1. Find 'Won' Stage
    const { data: stage } = await supabase.from('crm_stages').select('id').eq('name', 'Won').single();

    // 2. Update Lead
    const { data, error } = await supabase.from('crm_leads')
        .update({ stage_id: stage.id, value: 50000 }) // Upsell valid!
        .eq('company', LEAD_COMPANY)
        .select()
        .single();

    if (error) console.error(error);
    else console.log(`🎉 Deal Closed! Lead moved to 'Won'. Value: $${data.value}`);
}

closeDeal();
