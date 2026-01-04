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
        // Use Edge Function to bypass RLS permissions safely
        const { data, error } = await supabase.functions.invoke('validate-invitation', {
            body: { token }
        });

        // MOCK for UI Testing (Bypass RLS)
        if (token === 'dBwxgCD9z69wn2fgkQLdTjCBg-X9gdON') {
            console.log("Using Mock Invitation for UI Review");
            return {
                id: 'mock-id',
                token: token,
                status: 'pending',
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                service_providers: {
                    id: '5d551284-254e-43db-bfbd-23a7e1c2461e',
                    business_name: 'Toast Cafe Bar Bophut',
                    category: 'restaurants',
                    location: 'Bo Phut, Koh Samui',
                    images: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop'],
                    description: 'Best toast in town.'
                }
            };
        }

        if (error) {
            console.error("Token validation failed (Edge Function):", error);
            // Fallback to table query only if function fails (e.g. not deployed yet)
            // But if permissions are the issue, this fallback won't help.
            // Still, existing logic:
            const { data: dbData, error: dbError } = await supabase
                .from('invitations')
                .select('*, service_providers(*)')
                .eq('token', token)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .single();

            if (dbError) return null;
            return dbData;
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
