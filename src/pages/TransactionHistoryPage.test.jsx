import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TransactionHistoryPage from './TransactionHistoryPage';
import { WalletService } from '../services/wallet/WalletService';

// Mock WalletService
vi.mock('../services/wallet/WalletService', () => {
    return {
        WalletService: class {
            getTransactions = vi.fn().mockResolvedValue([
                { id: 1, type: 'award', amount: 50, currency: 'VIBES', reason: 'Review', created_at: '2023-01-01' },
                { id: 2, type: 'payment', amount: 100, currency: 'VIBES', reason: 'Booking', created_at: '2023-01-02' }
            ]);
            getBalance = vi.fn().mockResolvedValue({ thb: 0, vibes: 50 });
        }
    };
});

// Mock hooks if needed? No, we'll direct instantiate Service in component or use useQuery
// Ideally useQuery, but for simplicity let's assume useEffect or useQuery wrapping.
// For this test, let's assume the component instantiates service directly or via hook.
// Let's mock the hook if we use useWallet, but getTransactions is separate.
// We will look for 2 items.

describe('TransactionHistoryPage', () => {
    it('should render transaction list', async () => {
        render(<TransactionHistoryPage />);

        await waitFor(() => {
            expect(screen.getByText(/Review/i)).toBeInTheDocument();
            expect(screen.getByText(/Booking/i)).toBeInTheDocument();
            expect(screen.getByText(/50/)).toBeInTheDocument();
        });
    });
});
