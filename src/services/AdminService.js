import { realSupabase as supabase } from '../api/supabaseClient.js';
import seedData from '@/data/samui_real_data_seed.json';
import { SendEmail } from '@/api/integrations';
import { EmailTemplates } from './EmailTemplates';

/**
 * AdminService
 * centralised service for fetching platform-wide data.
 */
export const AdminService = {

    /**
     * Get all users (Signups)
     * Note: This fetches from 'users' public table which mirrors auth.users
     * @returns {Promise<{data: any[], error: any}>}
     */
    getUsers: async () => {
        try {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });

            if (error) {
                console.warn("AdminService: Users fetch failed", error);
                return { data: [], error };
            }
            return { data, error: null };
        } catch (e) {
            console.error("AdminService Error:", e);
            return { data: [], error: e };
        }
    },

    /**
     * Get all businesses (Service Providers)
     */


    // ... (existing code)

    getBusinesses: async () => {
        try {
            console.log("AdminService: getBusinesses called.");

            const { data, error } = await supabase
                .from('service_providers')
                .select('*')
                .order('created_at', { ascending: false });

            console.log("AdminService: Response received.", { dataLen: data?.length, error });

            if (error) {
                console.warn("AdminService: Business fetch failed, falling back to seed data.", error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.log("AdminService: No data from Supabase, using seed data.");
                return seedData;
            }

            return data;
        } catch (e) {
            console.error("AdminService Error (Using Seed Data):", e);
            // Fallback to seed data so the UI never hangs
            return seedData;
        }
    },

    /**
     * Get all bookings (Admin)
     */
    getBookings: async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    profiles:user_id (
                        full_name,
                        email
                    ),
                    service_providers (
                        business_name,
                        category
                    )
                `)
                .order('service_date', { ascending: false });

            if (error) {
                console.warn("AdminService: Bookings fetch failed", error);
                return { data: [], error };
            }
            return { data, error: null };
        } catch (e) {
            console.error("AdminService Error:", e);
            return { data: [], error: e };
        }
    },

    /**
     * Get Platform Stats (Revenue, MRR, Counts)
     */
    getStats: async () => {
        try {
            // Try calling the RPC function first for speed
            const { data, error } = await supabase.rpc('get_admin_stats');

            if (!error && data) {
                return data;
            }

            // Fallback: Client-side calculation if RPC not created yet
            console.warn("RPC get_admin_stats missing, calculating client-side...");
            const { data: users } = await AdminService.getUsers();
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
            const { error } = await supabase.rpc('admin_ban_user', { target_user_id: userId });
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
            const { error } = await supabase.rpc('admin_verify_business', { target_business_id: businessId });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Verification Failed:", e);
            return false;
        }
    },

    /**
     * Send Invitation Email
     */
    sendInvitationEmail: async (email, businessName, link) => {
        const html = EmailTemplates.getInvitationEmail(businessName, link);
        return await SendEmail({
            to: email,
            subject: 'Claim your Samui Service Hub Profile',
            html: html
        });
    }
};
