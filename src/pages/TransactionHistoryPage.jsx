import React, { useEffect, useState } from 'react';
import { WalletService } from '../services/WalletService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function TransactionHistoryPage({ userId: propUserId } = {}) {
    const { user } = useAuth();
    const userId = propUserId || user?.id;

    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        async function fetchHistory() {
            try {
                const data = await WalletService.getTransactions(userId, 'VIBES');
                setTransactions(data);
            } catch (err) {
                console.error("Failed to load transactions", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchHistory();
    }, [userId]);

    if (isLoading) return <div className="p-4">Loading Transactions...</div>;

    if (!userId) return <div className="p-4">Please log in to view history.</div>;

    if (!transactions.length) return <div className="p-4">No transactions found.</div>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold mb-4">💎 Vibe History</h1>
            <div className="space-y-3">
                {transactions.map((txn) => (
                    <div key={txn.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{txn.reason || 'Transaction'}</p>
                            <p className="text-sm text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <span className={`font-bold text-lg ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {txn.amount > 0 ? '+' : ''}{txn.amount}
                            </span>
                            <span className="text-xs text-gray-400 block">{txn.currency}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
