import { supabase } from "../api/supabaseClient";

export const WalletService = {
    /**
     * Get user's current wallet balance and details.
     */
    getWallet: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user logged in");

            const { data, error } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Wallet doesn't exist? Should be auto-created by trigger or initial RPC, 
                // but for now we can return zero or init.
                return { balance: 0, currency: 'THB', status: 'active' };
            }

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Wallet Fetch Error:", error);
            throw error;
        }
    },

    /**
     * Get transaction history for the user.
     */
    getTransactions: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // We need to query transactions where wallet_id belongs to user
            // OR recipient_wallet_id belongs to user.
            // Easiest is to utilize the RLS which already filters 'public.transactions'.
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Txn Fetch Error:", error);
            throw error;
        }
    },

    /**
     * Simulate a Top-Up (Demo Only).
     * In production, this would be a server-side webhook from Stripe/Omise.
     * For MVP, we call the 'process_transaction' RPC.
     */
    topUp: async (amount) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc('process_transaction', {
                p_user_id: user.id,
                p_amount: amount,
                p_type: 'topup',
                p_reference_id: `DEMO-${Date.now()}`,
                p_metadata: { method: 'demo_credit_card' }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("TopUp Error:", error);
            throw error;
        }
    },

    /**
     * Pay a merchant (Hold Funds).
     */
    payMerchant: async (merchantId, amount, referenceId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc('hold_funds', {
                p_user_id: user.id,
                p_merchant_id: merchantId,
                p_amount: amount,
                p_reference_id: referenceId
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Payment Error:", error);
            throw error;
        }
    }
};
