import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from './WalletService';
import { supabase } from '../../api/supabaseClient';

// Mock Supabase client
vi.mock('../../api/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

describe('WalletService', () => {
    let service: WalletService;

    beforeEach(() => {
        service = new WalletService();
        vi.clearAllMocks();
    });

    describe('getBalance', () => {
        it('should return correct balances from wallets table', async () => {
            // Setup mock response
            const mockData = { data: { balance: 1000, vibes_balance: 50 }, error: null };
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue(mockData)
                    })
                })
            });

            const balance = await service.getBalance('user-123');
            expect(balance).toEqual({ thb: 1000, vibes: 50 });
            expect(supabase.from).toHaveBeenCalledWith('wallets');
        });

        it('should return 0s if wallet not found (or handle error)', async () => {
            // Setup mock error response
            const mockResponse = { data: null, error: { code: 'PGRST116', message: 'No rows' } };
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue(mockResponse)
                    })
                })
            });

            const balance = await service.getBalance('user-123');
            expect(balance).toEqual({ thb: 0, vibes: 0 });
        });
    });

    describe('awardVibes', () => {
        it('should call award_vibes RPC', async () => {
            const mockRpcResponse = { data: { success: true }, error: null };
            (supabase.rpc as any).mockResolvedValue(mockRpcResponse);

            await service.awardVibes('user-123', 100, 'Signup Bonus');

            expect(supabase.rpc).toHaveBeenCalledWith('award_vibes', {
                target_user_id: 'user-123',
                amount: 100,
                reason: 'Signup Bonus'
            });
        });
    });
    describe('processBookingReward', () => {
        it('should calculate reward and award vibes', async () => {
            const bookingValue = 150; // 15 vibes
            const bookingId = 'booking-abc';

            // Spy on awardVibes
            const awardSpy = vi.spyOn(service, 'awardVibes').mockResolvedValue({ success: true });

            // We assume method exists (TypeScript will complain during test execution if strict checking, but runtime will fail effectively)
            // @ts-ignore
            await service.processBookingReward('user-123', bookingValue, bookingId);

            expect(awardSpy).toHaveBeenCalledWith('user-123', 15, expect.stringContaining(bookingId));
        });
    });
});
