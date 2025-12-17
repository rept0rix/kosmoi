
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
const LEAD_COMPANY = "Samui Elite Villas";

async function triggerResponse() {
    const { data: lead } = await supabase.from('crm_leads').select('id, first_name').eq('company', LEAD_COMPANY).single();

    // Create Task
    const taskDesc = `Client ${LEAD_COMPANY} just replied asking for pricing and vetting details. ` +
        `Draft a response email addressing their concerns. ` +
        `Pricing: 10% commission on services booked. Vetting: We interview every provider personally. ` +
        `Use 'insert_interaction' to save the draft. ` +
        `Lead ID: ${lead.id}.`;

    const { data: task } = await supabase.from('agent_tasks').insert([{
        title: `Respond to ${LEAD_COMPANY}`,
        description: taskDesc,
        assigned_to: 'sales-pitch',
        status: 'pending',
        priority: 'critical'
    }]).select().single();

    console.log(`✅ Response Task Created: ${task.id}. Waiting for agent...`);

    // Poll
    let turns = 0;
    while (turns < 45) {
        const { data } = await supabase.from('agent_tasks').select('status, result').eq('id', task.id).single();
        if (data.status === 'done') {
            console.log(`🎉 Interaction Drafted! Result: ${data.result}`);
            return;
        }
        await new Promise(r => setTimeout(r, 4000));
        process.stdout.write('.');
        turns++;
    }
}
triggerResponse();
