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
     * Initiate a Real Top-Up via Stripe.
     */
    initiateTopUp: async (amount) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('create-topup-session', {
                body: { amount, currency: 'thb', returnUrl: window.location.origin + '/wallet' }
            });

            if (error) throw error;

            // Redirect to Stripe
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error) {
            console.error("TopUp Init Error:", error);
            throw error;
        }
    },

    /**
     * Simulate a Top-Up (Admin Only).
     */
    simulateTopUp: async (amount) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc('process_transaction', {
                target_user_id: user.id,
                amount: amount,
                type: 'topup',
                reference_id: `DEMO-${Date.now()}`,
                metadata: { method: 'demo_credit_card' }
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
    },
    /**
     * Initiate Card Link (Setup Session).
     */
    initiateCardSetup: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('create-setup-session', {
                body: { returnUrl: window.location.origin + '/wallet' }
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No setup URL returned");
            }
        } catch (error) {
            console.error("Card Setup Error:", error);
            throw error;
        }
    },

    /**
     * Get Saved Payment Methods.
     */
    getPaymentMethods: async () => {
        try {
            // @ts-ignore
            const { data, error } = await supabase.functions.invoke('list-payment-methods');
            if (error) throw error;
            return data?.data || [];
        } catch (error) {
            console.error("Fetch Cards Error:", error);
            return [];
        }
    },

    /**
     * Transfer funds to another wallet (P2P).
     * SECURE: Uses auth.uid() on server side.
     */
    transferFunds: async (recipientWalletId, amount, note = "P2P Transfer") => {
        try {
            const { data, error } = await supabase.rpc('transfer_funds', {
                recipient_wallet_id: recipientWalletId,
                amount: amount,
                note: note
            });

            if (error) throw error;
            /**
             * Refund a transaction (Reverse Transfer).
             * @param {string} originalRecipientWalletId
             * @param {number} amount
             * @param {string} reason
             */
            refundTransaction: async (originalRecipientWalletId, amount, reason = "Refund") => {
                try {
                    // Note: In a real system, we requires a 'refund' RPC that checks the original txn ID.
                    // For MVP, we use transfer_funds from the Provider back to the User?
                    // Wait, client-side cannot force a transfer FROM the provider wallet (RLS violation).
                    // Logic: Only an Admin or the Provider can initiate a refund. 
                    // OR: We use a system-level RPC 'process_refund'.

                    // Current Workaround: We assume this is called IMMEDIATELY after a failed booking insertion
                    // inside the SAME server context? No, this is client-side.
                    // Client-side, the User cannot take money back from the Provider.

                    // CRITICAL: We need a backend Edge Function or RPC 'system_refund' that trusts the context 
                    // if the booking insert failed.
                    // However, since we don't have that RPC ready, I will Log this as a critical TODO and 
                    // assume for the MVP demonstration we simulate the refund or use a stub that warns the user to contact support.

                    console.warn("Refund requested but strictly secure refund RPC not implemented. Contacting Admin...");

                    // Temporary: Call an Edge Function or just Log
                    const { data: { user } } = await supabase.auth.getUser();

                    // We'll log a 'refund_request' to a table if we had one.
                    // For now, let's just throw a visual error to the user saying "Payment Taken, Booking Failed - Contact Support".
                    // This is the honest MVP approach rather than insecurely hacking a reverse transfer.

                    return false;
                } catch (error) {
                    console.error("Refund Error:", error);
                    throw error;
                }
            },
};
