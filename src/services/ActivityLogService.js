
import { supabase } from '../api/supabaseClient.js';

export const ActivityLogService = {

    /**
     * Log a user action
     * @param {string} userId - UUID of the user acting (or auth.uid() by default)
     * @param {string} actionType - e.g. 'LOGIN', 'LOGOUT', 'TRANSFER', 'UPDATE_PROFILE'
     * @param {string} description - Readable description
     * @param {object} metadata - Extra details (e.g. amount, target_id)
     */
    logAction: async (userId, actionType, description, metadata = {}) => {
        try {
            if (!userId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) userId = user.id;
            }

            if (!userId) {
                console.warn("ActivityLogService: No user found to log action", actionType);
                return;
            }

            const logEntry = {
                user_id: userId,
                action_type: actionType,
                description: description,
                metadata: metadata,
                // ip_address and user_agent could be added via Edge Functions if needed, 
                // client-side they are less reliable or available directly.
                user_agent: navigator.userAgent
            };

            const { error } = await supabase
                .from('user_activity_logs')
                .insert([logEntry]);

            if (error) {
                console.error("ActivityLogService Error:", error);
            }
        } catch (e) {
            console.error("ActivityLogService Exception:", e);
        }
    },

    /**
     * Get logs for a specific user (Admin only)
     */
    getLogsByUser: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (e) {
            console.error("ActivityLogService Fetch Error:", e);
            return { data: [], error: e };
        }
    }
};
