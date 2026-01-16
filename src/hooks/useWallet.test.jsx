import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWallet } from './useWallet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// We don't import WalletService because we mock it completely

// Mock WalletService correctly as a class
vi.mock('../services/wallet/WalletService', () => {
    return {
        // Use a real class for the mock to satisfy 'new'
        WalletService: class {
            getBalance = vi.fn().mockResolvedValue({ thb: 500, vibes: 100 });
        }
    };
});

// Setup wrapper for React Query
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useWallet', () => {
    it('should return balance from service', async () => {
        const { result } = renderHook(() => useWallet('user-1'), { wrapper: createWrapper() });

        // Wait for success and checking result
        await waitFor(() => expect(result.current.balance).toEqual({ thb: 500, vibes: 100 }));
        expect(result.current.isLoading).toBe(false);
    });
});
