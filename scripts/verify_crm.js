
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Env Vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Mocking CrmService logic since we can't import the file directly (it uses alias imports)
const CrmService = {
    async getPipelines() {
        const { data, error } = await supabase.from('crm_pipelines').select('*');
        if (error) throw error;
        return data;
    },
    async getStages(pipelineId) {
        const { data, error } = await supabase.from('crm_stages').select('*').eq('pipeline_id', pipelineId).order('position');
        if (error) throw error;
        return data;
    },
    async getLeads(pipelineId) {
        // Mocking the join logic
        const { data, error } = await supabase.from('crm_leads').select('*, stage:crm_stages(id, name, pipeline_id)');
        if (error) throw error;
        // Client side filter
        return data.filter(l => l.stage && l.stage.pipeline_id === pipelineId);
    }
};

async function verify() {
    console.log("🔍 Verifying CRM Data Flow...");
    try {
        const pipelines = await CrmService.getPipelines();
        console.log(`✅ Pipelines Found: ${pipelines.length}`);
        if (pipelines.length === 0) throw new Error("No pipelines found");

        const pid = pipelines[0].id;
        console.log(`   Using Pipeline: ${pipelines[0].name} (${pid})`);

        const stages = await CrmService.getStages(pid);
        console.log(`✅ Stages Found: ${stages.length}`);
        console.log(`   Stages: ${stages.map(s => s.name).join(' -> ')}`);

        const leads = await CrmService.getLeads(pid);
        console.log(`✅ Leads Found: ${leads.length}`);
        if (leads.length > 0) {
            console.log(`   Sample Lead: ${leads[0].first_name} ${leads[0].last_name} (${leads[0].stage.name})`);
        } else {
            console.warn("   ⚠️ No leads found. UI will be empty but functional.");
        }

    } catch (e) {
        console.error("❌ Verification Failed:", e);
        process.exit(1);
    }
}

verify();
