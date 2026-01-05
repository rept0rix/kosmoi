import { supabase } from '@/api/supabaseClient';

export const WalletService = {
    /**
     * Get wallet balance for a user.
     * @param {string} userId
     */
    async getBalance(userId) {
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no wallet exists, create one? Or return 0?
            // For now, let's assume auto-creation is handled elsewhere or we return 0 mock.
            // Actually better to try fetching, if error code is 'PGRST116' (No rows), return 0.
            if (error.code === 'PGRST116') return { balance: 0, currency: 'THB' };

            console.error("Wallet Fetch Error:", error);
            throw error;
        }

        return data;
    },

    /**
     * Ensure a wallet exists for the user.
     */
    async createWallet(userId) {
        const { data, error } = await supabase
            .from('wallets')
            .insert({ user_id: userId })
            .select()
            .single();

        if (error) {
            // If already exists, ignore
            if (error.code === '23505') return this.getBalance(userId);
            throw error;
        }
        return data;
    },

    /**
     * Transfer funds to another user.
     * @param {string} senderId 
     * @param {string} recipientId 
     * @param {number} amount 
     * @param {string} description 
     */
    async transfer(senderId, recipientId, amount, description = "P2P Transfer") {
        if (amount <= 0) throw new Error("Amount must be positive");

        const { data, error } = await supabase.rpc('transfer_funds', {
            sender_id: senderId,
            recipient_id: recipientId,
            amount: amount,
            description: description
        });

        if (error) throw error;
        return data;
    },

    /**
     * Get transaction history.
     */
    async getHistory(walletId) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
