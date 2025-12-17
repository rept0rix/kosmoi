
import { supabase } from "@/api/supabaseClient";

/**
 * Service for managing CRM data (Pipelines, Stages, Leads)
 */
export const CrmService = {
    /**
     * Fetch all available pipelines
     */
    async getPipelines() {
        const { data, error } = await supabase
            .from('crm_pipelines')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch stages for a specific pipeline
     */
    async getStages(pipelineId) {
        const { data, error } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('position', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch leads (optionally filtered by pipeline via stage join, but simpler to fetch all or filter in memory first)
     * For now, we'll fetch all leads and let the UI filter or join.
     * Ideally, we filter by pipeline if provided.
     */
    async getLeads(pipelineId = null) {
        let query = supabase
            .from('crm_leads')
            .select(`
                *,
                stage:crm_stages(id, name, color, pipeline_id)
            `)
            .order('updated_at', { ascending: false });

        if (pipelineId) {
            // This requires an inner join logic or filtering on the returned data if using Supabase standard join.
            // A simpler way for now is to fetch all and filter in JS if the dataset is small, 
            // OR use !inner join.
            query = query.not('stage_id', 'is', null);
            // We'll rely on client-side filtering or ensuring stage belongs to pipeline for MVP simplicity
        }

        const { data, error } = await query;
        if (error) throw error;

        // Client-side filter for pipeline if needed
        if (pipelineId && data) {
            return data.filter(lead => lead.stage?.pipeline_id === pipelineId);
        }

        return data;
    },

    /**
     * Create a new lead
     */
    async createLead(lead) {
        const { data, error } = await supabase
            .from('crm_leads')
            .insert([lead])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a lead (e.g. move stage)
     */
    async updateLead(id, updates) {
        const { data, error } = await supabase
            .from('crm_leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
