
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const LEAD_COMPANY = "Samui Elite Villas";

async function simulateReply() {
    // 1. Find the lead
    const { data: lead } = await supabase.from('crm_leads').select('id, stage_id').eq('company', LEAD_COMPANY).single();
    if (!lead) {
        console.error("Lead not found");
        return;
    }

    console.log(`📩 Simulating reply from ${LEAD_COMPANY} (${lead.id})...`);

    // 2. Log REPLY interaction
    const replyBody = "Hi Kosmoi Team,\n\nThanks for reaching out. Your platform sounds interesting. We actually struggle with finding reliable private chefs for our guests.\n\nCan you send over more details on your pricing and vetting process?\n\nRegards,\nMarcus";

    await supabase.from('crm_interactions').insert([{
        lead_id: lead.id,
        type: 'email_reply',
        summary: 'Positive Response - asking for pricing',
        details: replyBody,
        occurred_at: new Date().toISOString()
    }]);

    // 3. Update Stage (Move to 'Contacted' or 'Negotiation')
    // Let's find 'Contacted' stage
    const { data: stage } = await supabase.from('crm_stages').select('id').eq('name', 'Contacted').single();
    if (stage) {
        await supabase.from('crm_leads').update({ stage_id: stage.id }).eq('id', lead.id);
        console.log("✅ Lead moved to 'Contacted' stage.");
    }

    console.log("🎉 Simulation Step Complete: Client Replied.");
}

simulateReply();
