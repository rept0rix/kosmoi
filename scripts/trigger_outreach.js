
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// Define Agent Logic (Simplified Orchestrator)
async function draftEmail(lead) {
    console.log(`\n🤖 Drafting email for ${lead.company}...`);

    // In a real system, we'd call the Agent Service/API.
    // Here, I'll simulate the agent's output logic or call a "generate_email" tool if I had access to the LLM directly.
    // Since this is a specialized script running "as" the orchestration layer:

    // We will create a TASK for the worker to do this, so we can verify the agent actually does it.
    // But for speed and reliability given previous JSON issues, I will construct a HIGH PROBABILITY prompt task.

    const taskTitle = `Outreach: ${lead.company}`;
    const taskDesc = `Draft a polite, professional B2B cold email to ${lead.first_name} ${lead.last_name} at ${lead.company}.                     ` +
        `Propose a partnership with Kosmoi (Service Hub). ` +
        `Use the 'send_email' tool to SEND the email immediately (Real World Mode). ` +
        `RECIPIENT OVERRIDE: Send to 'na0ryank0@gmail.com' (Do NOT use the lead's email, this is a live test). ` +
        `Subject: 'Partnership Inquiry for ${lead.company}'. ` +
        `Interaction Type: 'email_outreach'. ` +
        `Interaction Summary: 'Sent Outreach Email'. ` +
        `Interaction Details: The full email body. ` +
        `Lead ID: '${lead.id}' (CRITICAL: Use this EXACT UUID). ` +
        `Reply with 'TASK_COMPLETED' in JSON format.`;

    const { data: task, error } = await supabase.from('agent_tasks').insert([{
        title: taskTitle,
        description: taskDesc,
        assigned_to: 'sales-pitch',
        status: 'pending',
        priority: 'high'
    }]).select().single();

    if (error) {
        console.error("Failed to create task:", error.message);
        return;
    }

    console.log(`✅ Task Created: ${task.id}. Waiting for agent...`);

    // Poll for completion
    let turns = 0;
    while (turns < 30) {
        const { data } = await supabase.from('agent_tasks').select('status, result').eq('id', task.id).single();
        if (data.status === 'done') {
            console.log(`🎉 Done! Result: ${data.result}`);
            return;
        }
        await new Promise(r => setTimeout(r, 4000));
        process.stdout.write('.');
        turns++;
    }
    console.log("Timeout waiting for agent.");
}

async function run() {
    // 1. Fetch recent leads (last 10 mins)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('*')
        .gt('created_at', tenMinsAgo);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${leads.length} recent leads.`);

    for (const lead of leads) {
        await draftEmail(lead);
    }
}

run();
