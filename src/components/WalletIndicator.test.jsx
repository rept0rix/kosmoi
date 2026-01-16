import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WalletIndicator from './WalletIndicator';
import { useWallet } from '../hooks/useWallet';

// Mock the hook
vi.mock('../hooks/useWallet', () => ({
    useWallet: vi.fn()
}));

describe('WalletIndicator', () => {
    it('should display balance when loaded', () => {
        // Setup mock return
        vi.mocked(useWallet).mockReturnValue({
            balance: { thb: 500, vibes: 100 },
            isLoading: false,
            error: null
        });

        render(<WalletIndicator userId="user-1" />);

        // Check for Vibe symbol or text
        expect(screen.getByText(/100/)).toBeInTheDocument();
        expect(screen.getByText(/💎/)).toBeInTheDocument(); // Assuming 💎 icon
    });

    it('should show loading state', () => {
        vi.mocked(useWallet).mockReturnValue({
            balance: null,
            isLoading: true,
            error: null
        });
        render(<WalletIndicator userId="user-1" />);
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
});
