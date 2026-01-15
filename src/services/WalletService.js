import { supabase } from "../api/supabaseClient.js";
import { VibeCalculator } from "./rewards/VibeCalculator";
import { ActivityLogService } from "./ActivityLogService";

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
     * Transfer funds to another user (P2P).
     * SECURE: Uses auth.uid() on server side for sender.
     * @param {string} recipientUserId - The UUID of the recipient USER (not wallet)
     * @param {number} amount
     * @param {string} currency - 'THB' or 'VIBES'
     * @param {string} note
     */
    transferFunds: async (recipientUserId, amount, currency = 'THB', note = "P2P Transfer") => {
        try {
            console.log(`Transferring ${amount} ${currency} to ${recipientUserId}`);

            const { data, error } = await supabase.rpc('transfer_funds_v2', {
                recipient_id: recipientUserId,
                amount: amount,
                currency: currency,
                description: note
            });

            if (error) throw error;

            // Log the transfer
            await ActivityLogService.logAction(null, 'TRANSFER', `Sent ${amount} ${currency} to ${recipientUserId}`, { recipient: recipientUserId, amount, currency, note });

            return data;
        } catch (error) {
            console.error("Transfer Error:", error);
            throw error;
        }
    },

    /**
     * Refund a transaction (Reverse Transfer).
     * @param {string} originalRecipientWalletId
     * @param {number} amount
     * @param {string} reason
     */
    refundTransaction: async (originalRecipientWalletId, amount, reason = "Refund") => {
        try {
            console.warn("Refund requested but strictly secure refund RPC not implemented. Contacting Admin...");

            // For now, let's just throw a visual error to the user
            return false;
        } catch (error) {
            console.error("Refund Error:", error);
            throw error;
        }
    },

    /**
     * Process booking reward
     */
    processBookingReward: async (userId, bookingValueUsd, bookingId) => {
        try {
            const calculator = new VibeCalculator();
            const vibes = calculator.calculateBookingReward(bookingValueUsd);

            if (vibes > 0) {
                const { data, error } = await supabase.rpc('award_vibes', {
                    target_user_id: userId,
                    amount: vibes,
                    reason: `Booking Reward: ${bookingId}`
                });
                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error("Booking Reward Error:", error);
            throw error;
        }
    },
};
