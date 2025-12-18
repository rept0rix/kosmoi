
import 'dotenv/config'; // Make sure to install dotenv if not present, or run with node -r dotenv/config
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCRM() {
    console.log("🌱 Starting CRM Seed...");

    // 1. Fetch Pipelines
    let { data: pipelines, error: pipelineError } = await supabase.from('crm_pipelines').select('id, name');
    if (pipelineError) {
        console.error("❌ Error fetching pipelines:", pipelineError);
        return;
    }

    if (!pipelines || pipelines.length === 0) {
        console.warn("⚠️ No pipelines found. Creating 'General Sales'...");
        const { data: newPipeline, error: createError } = await supabase
            .from('crm_pipelines')
            .insert([{ name: 'General Sales', type: 'sales' }])
            .select()
            .single();

        if (createError) {
            console.error("❌ Failed to create pipeline:", createError);
            return;
        }
        pipelines = [newPipeline];
    }

    const pipelineId = pipelines[0].id;
    console.log(`✅ Using Pipeline: ${pipelines[0].name} (${pipelineId})`);

    // 2. Fetch Stages
    let { data: stages, error: stageError } = await supabase
        .from('crm_stages')
        .select('id, name, position')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true });

    if (stageError) console.error("❌ Error fetching stages:", stageError);

    // Create default stages if missing
    if (!stages || stages.length === 0) {
        console.log("🛠 Creating default stages...");
        const defaultStages = [
            { name: 'New Lead', position: 1, color: '#3b82f6', pipeline_id: pipelineId },
            { name: 'Contacted', position: 2, color: '#eab308', pipeline_id: pipelineId },
            { name: 'Proposal Sent', position: 3, color: '#a855f7', pipeline_id: pipelineId },
            { name: 'Negotiation', position: 4, color: '#f97316', pipeline_id: pipelineId },
            { name: 'Won', position: 5, color: '#22c55e', pipeline_id: pipelineId },
        ];

        const { data: newStages, error: createStagesError } = await supabase
            .from('crm_stages')
            .insert(defaultStages)
            .select();

        if (createStagesError) {
            console.error("❌ Failed to create stages:", createStagesError);
            return;
        }
        stages = newStages;
    }

    console.log(`✅ Using ${stages.length} Stages`);
    const newLeadStage = stages.find(s => s.name === 'New Lead') || stages[0];

    // 3. Create Leads
    const sampleLeads = [
        { first_name: 'John', last_name: 'Doe', company: 'Acme Corp', email: 'john@acme.com', stage_id: newLeadStage.id, value: 5000, notes: 'Interested in enterprise plan' },
        { first_name: 'Jane', last_name: 'Smith', company: 'Globex', email: 'jane@globex.com', stage_id: newLeadStage.id, value: 12000, notes: 'Met at conference' },
        { first_name: 'Alice', last_name: 'Johnson', company: 'Soylent Corp', email: 'alice@soylent.com', stage_id: newLeadStage.id, value: 3000, notes: 'Referral from Bob' }
    ];

    console.log(`🌱 Seeding ${sampleLeads.length} Leads...`);
    const { data: createdLeads, error: leadError } = await supabase
        .from('crm_leads')
        .insert(sampleLeads)
        .select();

    if (leadError) {
        console.error("❌ Error creating leads:", leadError);
    } else {
        console.log(`✅ Created ${createdLeads.length} Leads`);
    }

    // 4. Create Sample Tasks
    if (createdLeads && createdLeads.length > 0) {
        const lead = createdLeads[0];
        const taskPayload = {
            title: `Outreach to ${lead.first_name}`,
            description: `Send initial email to ${lead.company}.`,
            status: 'pending',
            assigned_to: 'sales-agent',
            priority: 'high'
            // pipeline/stage context could be added if schema supports it
        };

        const { error: taskError } = await supabase.from('agent_tasks').insert([taskPayload]);
        if (taskError) console.error("❌ Error creating task:", taskError);
        else console.log("✅ Created Sample Task");
    }

    console.log("✨ Seed Complete!");
}

seedCRM();
