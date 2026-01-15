import { supabase } from '../../api/supabaseClient';
import { VibeCalculator } from '../rewards/VibeCalculator';

export class WalletService {
    /**
     * Get wallet balances (THB and VIBES)
     */
    async getBalance(userId: string): Promise<{ thb: number; vibes: number }> {
        const { data, error } = await supabase
            .from('wallets')
            .select('balance, vibes_balance')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no wallet found, return 0s (implied behavior for robustness)
            // Log error if needed: console.error(error);
            return { thb: 0, vibes: 0 };
        }

        return {
            thb: Number(data.balance) || 0,
            vibes: Number(data.vibes_balance) || 0
        };
    }

    /**
     * Award Vibes to a user
     */
    async awardVibes(userId: string, amount: number, reason: string): Promise<any> {
        const { data, error } = await supabase.rpc('award_vibes', {
            target_user_id: userId,
            amount: amount,
            reason: reason
        });

        if (error) throw error;
        return data;
    }

    /**
     * Get transaction history
     */
    async getTransactions(userId: string, currency: 'VIBES' | 'THB' = 'VIBES'): Promise<any[]> {
        // RLS handles the user filtering, typically. 
        // Ideally we select * from transactions where... 
        // But since the service runs on client, RLS applies.

        let query = supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (currency) {
            query = query.eq('currency', currency);
        }

        // Note: If running as admin/service_role (on backend), we would need explicit user filtering.
        // For now assuming client-side usage or RLS-compliant context.

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Process booking reward
     */
    async processBookingReward(userId: string, bookingValueUsd: number, bookingId: string): Promise<any> {
        const calculator = new VibeCalculator();
        const vibes = calculator.calculateBookingReward(bookingValueUsd);

        if (vibes > 0) {
            return this.awardVibes(userId, vibes, `Booking Reward: ${bookingId}`);
        }
    }
}
