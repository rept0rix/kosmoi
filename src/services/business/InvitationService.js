import { supabase } from '@/api/supabaseClient';
import { nanoid } from 'nanoid';

export const InvitationService = {
    /**
     * Create a new invitation for a service provider.
     * @param {string} providerId - ID of the service provider
     * @param {object} metadata - Optional metadata (e.g. target email)
     * @returns {Promise<object>} The created invitation
     */
    async createInvitation(providerId, metadata = {}) {
        const token = nanoid(32); // specific length secure token

        const { data, error } = await supabase
            .from('invitations')
            .insert({
                service_provider_id: providerId,
                token: token,
                metadata: metadata,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Validate an invitation token.
     * @param {string} token 
     * @returns {Promise<object>} The invitation details if valid
     */
    async validateToken(token) {
        const { data, error } = await supabase
            .from('invitations')
            .select('*, service_providers(*)')
            .eq('token', token)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error) {
            console.error("Token validation failed:", error);
            return null;
        }
        return data;
    },

    /**
     * Claim a profile using a valid token directly linking to the current user.
     * @param {string} token 
     * @param {string} userId 
     */
    async claimProfile(token, userId) {
        const { data, error } = await supabase
            .rpc('claim_business', { token_input: token });

        if (error) throw error;

        // The RPC returns a JSON object with success/error/providerId
        if (!data.success) {
            throw new Error(data.error || "Failed to claim profile.");
        }

        return { success: true, providerId: data.providerId };
    }
};
