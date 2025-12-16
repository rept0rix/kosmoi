import { supabase } from '../api/supabaseClient.js';

/**
 * SalesService
 * The central service for all CRM operations.
 * Handles Pipelines, Stages, Leads, and Interactions.
 */
export const SalesService = {

    // --- Pipelines & Stages ---

    async getPipelines() {
        const { data, error } = await supabase
            .from('crm_pipelines')
            .select('*')
            .order('name');
        if (error) throw error;
        return data;
    },

    async getStages(pipelineId) {
        // If no pipelineId provided, try to get the default one
        let pid = pipelineId;
        if (!pid) {
            const { data: defaultPipeline } = await supabase
                .from('crm_pipelines')
                .select('id')
                .eq('is_default', true)
                .single();
            if (defaultPipeline) pid = defaultPipeline.id;
        }

        if (!pid) return []; // No pipeline found

        const { data, error } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('pipeline_id', pid)
            .order('position');

        if (error) throw error;
        return data;
    },

    // --- Leads ---

    async getLeads(filters = {}) {
        let query = supabase.from('crm_leads').select('*').order('created_at', { ascending: false });

        if (filters.stage_id) query = query.eq('stage_id', filters.stage_id);
        if (filters.status) query = query.eq('status', filters.status);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Get Pipeline Data grouped by Stage ID for Kanban
     */
    async getPipelineData(pipelineId) {
        try {
            const stages = await this.getStages(pipelineId);
            const stagesMap = {};
            const stageIds = stages.map(s => {
                stagesMap[s.id] = s;
                return s.id;
            });

            // Fetch leads only for these stages
            const { data: leads, error } = await supabase
                .from('crm_leads')
                .select('*')
                .in('stage_id', stageIds)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by stage_id
            const pipelineData = {};
            stages.forEach(s => pipelineData[s.id] = []);

            leads.forEach(lead => {
                if (pipelineData[lead.stage_id]) {
                    pipelineData[lead.stage_id].push(lead);
                }
            });

            return { stages, leadsByStage: pipelineData };
        } catch (e) {
            console.error("SalesService.getPipelineData failed:", e);
            throw e;
        }
    },

    async createLead(leadData) {
        const { data, error } = await supabase
            .from('crm_leads')
            .insert([leadData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLead(leadId, updates) {
        const { data, error } = await supabase
            .from('crm_leads')
            .update(updates)
            .eq('id', leadId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateLeadStage(leadId, newStageId) {
        return this.updateLead(leadId, { stage_id: newStageId });
    },

    async deleteLead(leadId) {
        const { error } = await supabase.from('crm_leads').delete().eq('id', leadId);
        if (error) throw error;
    },

    // --- Interactions ---

    async getInteractions(leadId) {
        const { data, error } = await supabase
            .from('crm_interactions')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createInteraction(leadId, type, content) {
        const { data, error } = await supabase
            .from('crm_interactions')
            .insert([{ lead_id: leadId, type, content }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // --- Agent Actions (Simulation) ---

    /**
     * AI Agent: Auto-Qualify Batch
     * Moves 'New' leads to 'Qualified'
     */
    async runAutoQualify() {
        try {
            // Find "New" and "Qualified" stages dynamically
            // ideally we normally query stages by metadata, but name matching works for now
            const { data: stages } = await supabase.from('crm_stages').select('*');

            const newStage = stages.find(s => s.name.toLowerCase().includes('new'));
            const qualStage = stages.find(s => s.name.toLowerCase().includes('qualified'));

            if (!newStage || !qualStage) return { message: "Required stages (New/Qualified) not found." };

            const { data: newLeads } = await supabase
                .from('crm_leads')
                .select('*')
                .eq('stage_id', newStage.id)
                .limit(5);

            if (!newLeads || newLeads.length === 0) return { message: "No new leads to qualify." };

            // Update leads
            const updates = newLeads.map(lead =>
                this.updateLead(lead.id, {
                    stage_id: qualStage.id, // Explicitly safe due to check above
                    status: 'open',
                    priority: 'medium'
                })
            );

            await Promise.all(updates);
            return { message: `Analyzed and qualified ${newLeads.length} leads.` };
        } catch (error) {
            console.error("AutoQualify Error:", error);
            return { message: "Error during qualification." };
        }
    },

    /**
     * AI Agent: Blast Outreach
     * Queues a task for the Worker (Second Computer) to execute.
     */
    async runOutreachCampaign() {
        try {
            const { data: stages } = await supabase.from('crm_stages').select('*');
            const qualStage = stages.find(s => s.name.toLowerCase().includes('qualified'));
            const contactedStage = stages.find(s => s.name.toLowerCase().includes('contacted')); // Needed for info

            if (!qualStage?.id) return { message: "Qualified stage not found." };

            const { data: targetLeads } = await supabase
                .from('crm_leads')
                .select('*')
                .eq('stage_id', qualStage.id);

            if (!targetLeads || targetLeads.length === 0) return { message: "No qualified leads to contact." };

            // Create a Task for the Worker
            // This enables DISTRIBUTED EXECUTION. The specific logic (email generation, logging) happens implicitly by the agent following the prompt.
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
