import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, QrCode, ArrowUpRight, ArrowDownLeft, History, RefreshCcw, CreditCard } from 'lucide-react';
import { WalletService } from '@/services/WalletService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const ActionButton = ({ icon: Icon, label, onClick, colorClass = "bg-primary" }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors"
    >
        <div className={`p-4 rounded-full ${colorClass} text-white shadow-lg`}>
            <Icon size={24} />
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </motion.button>
);

const TransactionItem = ({ txn }) => {
    const isCredit = txn.amount > 0;
    const isPending = txn.status === 'held' || txn.status === 'pending';

    return (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-lg">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} ${isPending ? 'bg-yellow-100 text-yellow-600' : ''}`}>
                    {isPending ? <History size={20} /> : (isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />)}
                </div>
                <div>
                    <p className="font-medium text-slate-900 dark:text-white capitalize">
                        {txn.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(txn.created_at).toLocaleDateString()} • {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {txn.reference_id && <p className="text-[10px] text-slate-400 font-mono">Ref: {txn.reference_id}</p>}
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-slate-900 dark:text-white'} ${isPending ? 'text-yellow-600' : ''}`}>
                    {isCredit ? '+' : ''}{parseFloat(txn.amount).toFixed(2)} THB
                </p>
                <p className={`text-xs capitalize ${txn.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {txn.status}
                </p>
            </div>
        </div>
    );
};

export default function WalletPage() {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            const walletData = await WalletService.getWallet();
            setWallet(walletData);
            const txns = await WalletService.getTransactions();
            setTransactions(txns);
        } catch (error) {
            console.error("Failed to load wallet", error);
            toast({
                variant: "destructive",
                title: "Error loading wallet",
                description: "Could not fetch your balance. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleTopUp = async () => {
        try {
            // Simulation for MVP
            await WalletService.topUp(1000.00);
            toast({
                title: "Top Up Successful! 💰",
                description: "Added 1,000 THB to your wallet (Demo Mode).",
            });
            fetchWalletData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Top Up Failed",
                description: error.message
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 md:p-8">
            <div className="max-w-md mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">Kosmoi Pay</h1>
                    <Button variant="ghost" size="icon" onClick={fetchWalletData} disabled={loading}>
                        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>

                {/* Hero Card - Balance */}
                <GlassCard className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 border-none shadow-xl text-white p-6 relative overflow-hidden">
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-xl" />

                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-blue-100 text-sm font-medium flex items-center gap-2">
                            <Wallet size={16} /> Current Balance
                        </span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h2 className="text-4xl font-bold font-['Outfit'] tracking-tight">
                                {wallet ? parseFloat(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '---'}
                            </h2>
                            <span className="text-xl font-medium text-blue-200">THB</span>
                        </div>
                        {wallet?.status === 'active' && (
                            <div className="flex items-center gap-2 mt-4 text-xs bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Active Wallet
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard className="grid grid-cols-4 gap-2 bg-white/80 dark:bg-black/40">
                    <ActionButton
                        icon={QrCode}
                        label="Scan"
                        onClick={() => toast({ title: "Scanner Coming Soon", description: "QR Scanner module loading..." })}
                        colorClass="bg-indigo-500"
                    />
                    <ActionButton
                        icon={ArrowUpRight}
                        label="Top Up"
                        onClick={handleTopUp}
                        colorClass="bg-blue-500"
                    />
                    <ActionButton
                        icon={ArrowDownLeft}
                        label="Request"
                        onClick={() => toast({ title: "Feature Pending", description: "Request funds logic here." })}
                        colorClass="bg-purple-500"
                    />
                    <ActionButton
                        icon={CreditCard}
                        label="Card"
                        onClick={() => toast({ title: "Virtual Card", description: "Manage your virtual Kosmoi Card." })}
                        colorClass="bg-pink-500"
                    />
                </GlassCard>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h3>
                        <Button variant="link" className="text-blue-600 p-0 h-auto">View All</Button>
                    </div>

                    <GlassCard className="bg-white/80 dark:bg-black/40 min-h-[300px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <RefreshCcw className="animate-spin mb-2" />
                                <p>Loading transactions...</p>
                            </div>
                        ) : transactions.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {transactions.map((txn) => (
                                    <TransactionItem key={txn.id} txn={txn} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-full mb-3">
                                    <History size={24} />
                                </div>
                                <p>No transactions yet.</p>
                                <p className="text-sm">Top up your wallet to get started!</p>
                            </div>
                        )}
                    </GlassCard>
                </div>

            </div>
        </div>
    );
}
