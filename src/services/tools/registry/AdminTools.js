import { ToolRegistry } from "../ToolRegistry.js";
import { realSupabase as supabase } from "../../../api/supabaseClient.js";

// --- ADMIN OPS TOOLS ---

ToolRegistry.register(
    "update_business",
    "Update any field of a business (Admin Override)",
    {
        id: "Business UUID",
        updates: "JSON object of fields to update (e.g. { status: 'verified', metadata: { ... } })"
    },
    async (payload) => {
        // payload: { id, updates }
        try {
            const { id, updates } = payload;
            if (!id || !updates) return "[Error] Missing id or updates.";

            console.log(`[AdminTools] Updating business ${id}...`, updates);

            const { data, error } = await supabase
                .from('service_providers')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) throw error;
            return `[Success] Business updated: ${JSON.stringify(data[0])}`;
        } catch (e) {
            return `[Error] Update failed: ${e.message}`;
        }
    });

ToolRegistry.register(
    "ban_user",
    "Ban a user/provider for violations",
    {
        userId: "User/Provider ID to ban",
        reason: "Reason for the ban"
    },
    async (payload) => {
        // payload: { userId, reason }
        try {
            const { userId, reason } = payload;
            // In a real app, this might toggle an 'is_banned' column in auth.users or public.profiles
            // For this MVP, we will set status='inactive' in service_providers if they are a provider
            // and log the ban.

            console.log(`[AdminTools] Banning user ${userId} for: ${reason}`);

            // 1. Check if provider
            const { error: providerError } = await supabase
                .from('service_providers')
                .update({ status: 'inactive', metadata: { banned: true, ban_reason: reason } })
                .eq('owner_id', userId); // Assuming owner_id links to auth

            // If no owner_id match, maybe it's the specific table ID?
            // Let's try ID too just in case context used the table ID
            await supabase
                .from('service_providers')
                .update({ status: 'inactive', metadata: { banned: true, ban_reason: reason } })
                .eq('id', userId);

            return `[Success] User/Provider ${userId} has been banned (Status -> Inactive). Reason: ${reason}`;
        } catch (e) {
            return `[Error] Ban failed: ${e.message}`;
        }
    });

ToolRegistry.register(
    "get_analytics",
    "Get high-level platform stats",
    { metric: "Metric name (users, revenue, activity)" },
    async (payload) => {
        try {
            const { metric } = payload;
            // Mocking sophisticated analytics for MVP
            const stats = {
                users: { total: 1250, new_today: 12, active_7d: 850 },
                revenue: { current_mrr: "$4,200", growth: "+15%" },
                activity: { searches_24h: 3400, bookings: 45 }
            };

            if (metric && stats[metric]) {
                return JSON.stringify(stats[metric]);
            }

            return JSON.stringify(stats);
        } catch (e) {
            return `[Error] Analytics fetch failed: ${e.message}`;
        }
    });
