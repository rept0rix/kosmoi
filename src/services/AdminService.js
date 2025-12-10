
import { db } from '../api/supabaseClient.js';

/**
 * AdminService
 * centralised service for fetching platform-wide data.
 */
export const AdminService = {

    /**
     * Get all users (Signups)
     */
    getUsers: async () => {
        try {
            const { data, error } = await db.entities.Profile.select('*').order('created_at', { ascending: false });

            if (error) {
                console.warn("AdminService: Users fetch failed", error);
                return [];
            }
            return data;
        } catch (e) {
            console.error("AdminService Error:", e);
            return [];
        }
    },

    /**
     * Get all businesses (Service Providers)
     */
    getBusinesses: async () => {
        try {
            const { data, error } = await db.entities.ServiceProvider.select('*').order('created_at', { ascending: false });
            if (error) {
                console.warn("AdminService: Business fetch failed", error);
                return [];
            }
            return data;
        } catch (e) {
            console.error("AdminService Error:", e);
            return [];
        }
    },

    /**
     * Get Platform Stats (Revenue, MRR, Counts)
     */
    getStats: async () => {
        try {
            // Try calling the RPC function first for speed
            const { data, error } = await db.rpc('get_admin_stats');

            if (!error && data) {
                return data;
            }

            // Fallback: Client-side calculation if RPC not created yet
            console.warn("RPC get_admin_stats missing, calculating client-side...");
            const users = await AdminService.getUsers();
            const businesses = await AdminService.getBusinesses();

            let mrr = 0;
            const activeSubs = businesses.filter(b => b.badge === 'verified').length;
            mrr = activeSubs * 29;

            return {
                totalUsers: users.length,
                totalBusinesses: businesses.length,
                mrr: mrr,
                activeSubscriptions: activeSubs
            };

        } catch (e) {
            console.error("Stats Error:", e);
            return { totalUsers: 0, totalBusinesses: 0, mrr: 0, activeSubscriptions: 0 };
        }
    },

    /**
     * Ban/Unban User
     */
    toggleUserBan: async (userId) => {
        try {
            const { error } = await db.rpc('admin_ban_user', { target_user_id: userId });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Ban Failed:", e);
            return false;
        }
    },

    /**
     * Verify/Unverify Business
     */
    toggleBusinessVerification: async (businessId) => {
        try {
            const { error } = await db.rpc('admin_verify_business', { target_business_id: businessId });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Verification Failed:", e);
            return false;
        }
    }
};
