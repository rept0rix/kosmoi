import { supabase } from '../api/supabaseClient.js';

/**
 * SalesService
 * The "Brain" of the Sales Agent.
 * Handles lead qualification, pipeline management, and autonomous outreach simulation.
 */
export const SalesService = {

    /**
     * Get Leads Visualization
     * Returns leads grouped by status for Kanban board.
     */
    getPipeline: async () => {
        try {
            // 1. Fetch Pipelines & Stages
            const { data: stages, error: stagesError } = await supabase.from('crm_stages')
                .select(`
                    id,
                    name,
                    position,
                    color,
                    pipeline:crm_pipelines!inner(name)
                `)
                .order('position');

            if (stagesError) throw stagesError;

            // 2. Fetch Leads
            const { data: leads, error: leadsError } = await supabase.from('crm_leads')
                .select('*');

            if (leadsError) throw leadsError;

            // 3. Group Leads by Stage Name (normalized to lower case keys for UI)
            // UI expects keys: new, qualified, contacted, won, negotiation (maybe)
            // We need to map the dynamic stages to these keys or update UI to be dynamic.
            // For now, let's map dynamic stages to the expected keys if possible, or return a dynamic structure.
            // AdminCRM.jsx expects hardcoded keys: new, qualified, contacted, won.

            const pipeline = {
                new: [],
                qualified: [],
                contacted: [],
                won: []
            };

            // Helper to map stage name to key
            const getStageKey = (stageName) => {
                const lower = stageName.toLowerCase();
                if (lower.includes('new')) return 'new';
                if (lower.includes('qualified')) return 'qualified';
                if (lower.includes('contact')) return 'contacted';
                if (lower.includes('won')) return 'won';
                return 'new'; // Fallback
            };

            leads.forEach(lead => {
                const stage = stages.find(s => s.id === lead.stage_id);
                if (stage) {
                    const key = getStageKey(stage.name);
                    if (pipeline[key]) pipeline[key].push({
                        ...lead,
                        business_name: lead.company || `${lead.first_name} ${lead.last_name}`,
                        category: lead.source // Mapping source to category for UI display
                    });
                }
            });

            return pipeline;
        } catch (e) {
            console.error("SalesService Pipeline Error:", e);
            return { new: [], qualified: [], contacted: [], won: [] };
        }
    },

    /**
     * AI Agent: Auto-Qualify Batch
     * Simulates the agent analyzing a batch of new leads.
     */
    runAutoQualify: async () => {
        // In real app, this would use an LLM to analyze lead data
        // For now, we'll just move some leads from 'New' to 'Qualified'

        try {
            // Fetch 'New' stage ID
            const { data: newStage } = await supabase.from('crm_stages').select('id').ilike('name', '%new%').single();
            const { data: qualStage } = await supabase.from('crm_stages').select('id').ilike('name', '%qualified%').single();

            if (!newStage || !qualStage) return { message: "Stages not found." };

            const { data: newLeads } = await supabase.from('crm_leads').select('id').eq('stage_id', newStage.id).limit(5);

            if (!newLeads || newLeads.length === 0) return { message: "No new leads to qualify." };

            // Update leads to Qualified
            const updates = newLeads.map(lead =>
                supabase.from('crm_leads').update({ stage_id: qualStage.id }).eq('id', lead.id)
            );

            await Promise.all(updates);

            return {
                message: `Analyzed and qualified ${newLeads.length} leads.`
            };
        } catch (error) {
            console.error("AutoQualify Error:", error);
            return { message: "Error during qualification." };
        }
    },

    /**
     * AI Agent: Blast Outreach
     * Simulates sending emails/messages to the 'Qualified' column.
     */
    runOutreachCampaign: async (targetLeads) => {
        // In real app, this would create rows in 'crm_interactions'
        // For now, move to 'Contacted'
        try {
            const { data: contactedStage } = await supabase.from('crm_stages').select('id').ilike('name', '%contacted%').single();

            if (!contactedStage) return { message: "Contacted stage not found." };

            const updates = targetLeads.map(lead =>
                supabase.from('crm_leads').update({ stage_id: contactedStage.id }).eq('id', lead.id)
            );

            await Promise.all(updates);

            return {
                sent: targetLeads.length,
                channel: 'email',
                message: `Campaign initiated. Moved ${targetLeads.length} leads to Contacted.`
            };
        } catch (error) {
            console.error("Outreach Error:", error);
            return { message: "Error during outreach." };
        }
    }
};
