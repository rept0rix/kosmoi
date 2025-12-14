import { realSupabase } from '../api/supabaseClient.js';

export const PaymentService = {
    /**
     * Get or create a wallet for a user
     * @param {string} userId 
     */
    getWallet: async (userId) => {
        if (!userId) throw new Error("User ID required");

        // Try to fetch existing
        const { data, error } = await realSupabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
            console.error("Error fetching wallet:", error);
            return null;
        }

        if (data) return data;

        // Create if not exists
        const { data: newWallet, error: createError } = await realSupabase
            .from('wallets')
            .insert([{ user_id: userId, balance: 0 }])
            .select()
            .single();

        if (createError) {
            console.error("Error creating wallet:", createError);
            throw createError;
        }

        return newWallet;
    },

    /**
     * Get transaction history
     * @param {string} userId 
     */
    getTransactionHistory: async (userId) => {
        // First get wallet id
        const wallet = await PaymentService.getWallet(userId);
        if (!wallet) return [];

        const { data, error } = await realSupabase
            .from('transactions')
            .select(`
                *,
                bookings (
                    service_date,
                    service_type
                )
            `)
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }

        return data;
    },

    /**
     * Add credits (Deposit) - Simulation/Stripe Hook
     * In real app, this is called by server webhook after Stripe success.
     * @param {string} userId 
     * @param {number} amount 
     */
    addCredits: async (userId, amount) => {
        // Call the secure RPC
        const { data, error } = await realSupabase.rpc('process_wallet_transaction', {
            p_user_id: userId,
            p_amount: amount,
            p_type: 'credit',
            p_description: 'Deposit via Stripe (Mock)',
            p_reference_id: 'dep_' + Math.random().toString(36).substr(2, 9)
        });

        if (error) {
            console.error("Error adding credits:", error);
            throw error;
        }
        return data;
    },

    /**
     * Process payment between users
     */
    payForBooking: async (userId, providerId, amount, bookingId, description) => {
        // 1. Get payer wallet
        const payerWallet = await PaymentService.getWallet(userId);
        if (!payerWallet) throw new Error("Payer wallet missing");

        // 2. Get provider wallet (need to find wallet by provider's user_id)
        const { data: provider } = await realSupabase
            .from('service_providers')
            .select('owner_id')
            .eq('id', providerId)
            .single();

        if (!provider || !provider.owner_id) throw new Error("Provider owner not found");

        const receiverWallet = await PaymentService.getWallet(provider.owner_id);

        // 3. Call RPC
        const { data, error } = await realSupabase.rpc('process_payment', {
            payer_wallet_id: payerWallet.id,
            receiver_wallet_id: receiverWallet.id,
            amount: amount,
            booking_id: bookingId,
            description: description
        });

        if (error) throw error;
        return data;
    }
};
