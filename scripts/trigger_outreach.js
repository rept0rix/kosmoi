
import { createClient } from '@supabase/supabase-js';

// Load env vars if needed - assuming they are in process.env or loaded via command line
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SalesService mock using the service role client
const SalesServiceFull = {
    async createLead(leadData) {
        const { data, error } = await supabase.from('crm_leads').insert([leadData]).select().single();
        if (error) throw error;
        return data;
    },
    async runOutreachCampaign() {
        try {
            const { data: stages } = await supabase.from('crm_stages').select('*');
            // Assuming "Qualified" stage exists as verified in DB
            const qualStage = stages.find(s => s.name.toLowerCase().includes('qualified'));
            const contactedStage = stages.find(s => s.name.toLowerCase().includes('contacted'));

            if (!qualStage?.id) return { message: "Qualified stage not found." };

            const { data: targetLeads } = await supabase
                .from('crm_leads')
                .select('*')
                .eq('stage_id', qualStage.id);

            if (!targetLeads || targetLeads.length === 0) return { message: "No qualified leads to contact." };

            const taskPayload = {
                title: `CRM Outreach Campaign: ${new Date().toLocaleDateString()}`,
                description: `Conduct outreach for ${targetLeads.length} qualified leads.\n\nTarget Stage ID for success: ${contactedStage?.id}\n\nLead IDs: ${targetLeads.map(l => l.id).join(', ')}\n\nInstructions:\n1. For each lead, generating a personalized hello email.\n2. Log the email content as an interaction (type: 'email').\n3. Update the lead's stage_id to the Target Stage ID.\n\nUse your tools 'update_lead' (or similar Supabase tools) and 'insert_interaction'.`,
                status: 'pending',
                assigned_to: 'sales-agent',
                priority: 'high'
            };

            const { error } = await supabase.from('agent_tasks').insert([taskPayload]);

            if (error) throw error;

            return {
                sent: 0,
                queued: true,
                message: `Outreach Task Queued for ${targetLeads.length} leads. Worker will process.`
            };
        } catch (error) {
            console.error("Outreach Error:", error);
            return { message: "Error queuing outreach task." };
        }
    }
};

async function testOutreach() {
    console.log("Starting Outreach Test with Service Role...");

    // 1. Ensure we have a qualified lead
    const { data: stages } = await supabase.from('crm_stages').select('*');
    const qualStage = stages.find(s => s.name.toLowerCase().includes('qualified'));

    if (!qualStage) {
        console.error("Qualified stage not found! Available stages:", stages.map(s => s.name));
        return;
    }

    // Insert a dummy qualified lead if none exists
    const { data: existing } = await supabase.from('crm_leads').select('id').eq('stage_id', qualStage.id).limit(1);

    if (!existing || existing.length === 0) {
        console.log("Creating dummy qualified lead...");
        await SalesServiceFull.createLead({
            first_name: 'Test',
            last_name: 'Lead',
            company: 'Test Corp',
            email: 'test@example.com',
            stage_id: qualStage.id,
            status: 'open',
            value: 5000
        });
    }

    // 2. Run Outreach
    console.log("Running Outreach Logic...");
    const result = await SalesServiceFull.runOutreachCampaign();
    console.log("Result:", result);

    if (result.queued) {
        console.log("SUCCESS: Task queued for worker.");
        // Verify task exists
        const { data: tasks } = await supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(1);
        console.log("Latest Task Created:", tasks[0]);
    } else {
        console.error("FAILED to queue task:", result.message);
    }
}

testOutreach();
