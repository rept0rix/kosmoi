import React from 'react';
import { useWallet } from '../hooks/useWallet';

export default function WalletIndicator({ userId }) {
    const { balance, isLoading } = useWallet(userId);

    if (isLoading) return <div className="animate-pulse h-6 w-16 bg-gray-200 rounded">Loading...</div>;

    return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
            <span className="text-lg" role="img" aria-label="vibes">💎</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300">{balance.vibes || 0}</span>
        </div>
    );
}
