import { useQuery } from '@tanstack/react-query';
import { WalletService } from '../services/wallet/WalletService';

const walletService = new WalletService();

export function useWallet(userId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['wallet', userId],
        queryFn: () => walletService.getBalance(userId),
        enabled: !!userId,
        // Add staleTime to prevent excessive refetching
        staleTime: 1000 * 60, // 1 minute
    });

    return {
        balance: data || { thb: 0, vibes: 0 },
        isLoading,
        error
    };
}
