
import { supabase } from "@/api/supabaseClient";

export const CampaignService = {
    /**
     * Get aggregate stats for Operation Roar
     */
    async getRoarStats() {
        const { data: leads, error } = await supabase
            .from('crm_leads')
            .select('*')
            .contains('tags', ['smoke_test']) // We tagged them as 'smoke_test'
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Initialize counters
        const stats = {
            total: leads.length,
            taxi: 0,
            massage: 0,
            repair: 0,
            recent: leads.slice(0, 10) // Top 10 recent
        };

        // Aggregate
        leads.forEach(lead => {
            if (lead.tags && lead.tags.includes('taxi')) stats.taxi++;
            if (lead.tags && lead.tags.includes('massage')) stats.massage++;
            if (lead.tags && lead.tags.includes('repair')) stats.repair++;
        });

        return stats;
    }
};
