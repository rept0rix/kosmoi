import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("🌱 Seeding CRM Task for Worker Verification...");

    // 1. Create a dummy lead
    const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .insert([{
            first_name: 'Test',
            last_name: 'Worker',
            company: 'Worker Test Corp',
            email: 'worker@test.com',
            stage_id: 'db426c11-180a-4da2-a664-df8957864197', // Assuming this is a valid stage UUID, need to be careful.
            // Actually, let's fetch a stage first to be safe.
        }])
        .select()
        .single();

    // Fallback if insert fails (maybe checking stages first would be better)
    let targetLead = lead;
    if (leadError) {
        console.warn("⚠️ Lead insert failed (might already exist or stage invalid). Fetching existing leads.");
        const { data: existingLeads } = await supabase.from('crm_leads').select('*').limit(1);
        targetLead = existingLeads?.[0];
    }

    if (!targetLead) {
        console.error("❌ No lead available to test.");
        process.exit(1);
    }

    console.log(`🎯 Target Lead: ${targetLead.id} (${targetLead.first_name})`);

    // 2. Create the Task
    const taskPayload = {
        title: `VERIFICATION: CRM Outreach ${new Date().toISOString()}`,
        description: `Conduct outreach for lead ${targetLead.id}.\n\nInstructions:\n1. Generate a hello email.\n2. insert_interaction for the email.\n3. update_lead stage using update_lead tool (just dummy update is fine).`,
        status: 'pending',
        assigned_to: 'sales-agent',
        priority: 'high'
    };

    const { data: task, error: taskError } = await supabase
        .from('agent_tasks')
        .insert([taskPayload])
        .select()
        .single();

    if (taskError) {
        console.error("❌ Failed to create task:", taskError);
        process.exit(1);
    }

    console.log(`✅ Task Created: ${task.id}`);
    console.log("Run 'node scripts/agent_worker.js' to verify execution.");
}

main();
