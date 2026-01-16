import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TransactionHistoryPage from './TransactionHistoryPage';
import { WalletService } from '../services/WalletService';

// Mock Auth wrapper
vi.mock('@/features/auth/context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' }
    })
}));

// Mock WalletService
vi.mock('../services/WalletService', () => {
    return {
        WalletService: {
            getTransactions: vi.fn().mockResolvedValue([
                { id: 1, type: 'award', amount: 50, currency: 'VIBES', reason: 'Review', created_at: '2023-01-01' },
                { id: 2, type: 'payment', amount: 100, currency: 'VIBES', reason: 'Booking', created_at: '2023-01-02' }
            ]),
            getBalance: vi.fn().mockResolvedValue({ thb: 0, vibes: 50 })
        }
    };
});

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
