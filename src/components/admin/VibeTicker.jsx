
import React, { useEffect, useState } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { Badge } from '../ui/badge';
import { Bitcoin, ArrowRight, Wallet, PartyPopper } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const VibeTicker = () => {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({ flow24h: 0, volume24h: 0 });

    // Initial Load
    useEffect(() => {
        const fetchRecent = async () => {
            const { data } = await realSupabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setTransactions(data);
        };
        fetchRecent();
    }, []);

    // Real-time Subscription
    useEffect(() => {
        const channel = realSupabase
            .channel('vibe-ticker')
            // @ts-ignore
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transactions' },
                (payload) => {
                    const newItem = payload.new;
                    setTransactions(prev => [newItem, ...prev].slice(0, 10));
                    // Simple flow animation logic could go here
                }
            )
            .subscribe();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'deposit': return <Wallet className="w-4 h-4 text-green-400" />;
            case 'reward': return <PartyPopper className="w-4 h-4 text-pink-400" />;
            default: return <Bitcoin className="w-4 h-4 text-yellow-400" />;
        }
    };

    return (
        <div className="w-full bg-slate-900/50 border-y border-white/5 backdrop-blur-sm h-12 flex items-center overflow-hidden relative">
            <div className="absolute left-0 bg-slate-900/80 px-4 h-full flex items-center z-10 font-bold text-xs uppercase tracking-wider text-blue-400 border-r border-white/5">
                Vibe Economy
            </div>

            <div className="flex animate-marquee hover:pause whitespace-nowrap pl-32 items-center gap-8">
                {transactions.map(tx => (
                    <div key={tx.id} className="inline-flex items-center gap-2 text-sm text-slate-300">
                        {getIcon(tx.type)}
                        <span className="font-mono font-bold text-white">{tx.amount} VIBES</span>
                        <span className="text-xs text-slate-500 uppercase">{tx.type}</span>
                        {tx.description && <span className="text-xs text-slate-400 max-w-[150px] truncate">- {tx.description}</span>}
                        <span className="text-[10px] text-slate-600">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </span>
                        <div className="h-4 w-px bg-white/10 ml-4"></div>
                    </div>
                ))}
                {transactions.length === 0 && (
                    <span className="text-slate-500 text-xs italic">Market is quiet... waiting for transactions.</span>
                )}
            </div>
        </div>
    );
};

export default VibeTicker;
