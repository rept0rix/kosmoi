import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletService } from '@/services/payments/WalletService';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Loader2, Send, Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminWallet() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);

    // Transfer State
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');

    const fetchWallet = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Ensure wallet exists
            const wallet = await WalletService.getWallet();
            setBalance(wallet.balance || 0);

            // Get history
            const txs = await WalletService.getTransactions();
            setHistory(txs || []);
        } catch (error) {
            console.error("Wallet Error:", error);
            toast.error("Failed to load wallet data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [user]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!amount || !recipientId) return;

        setTransferring(true);
        try {
            await WalletService.transferFunds(recipientId, parseFloat(amount), "Admin Transfer");
            toast.success("Transfer successful!");
            setAmount('');
            setRecipientId('');
            fetchWallet(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Transfer failed: " + error.message);
        } finally {
            setTransferring(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-2">
            <header className="flex flex-col gap-2 mb-8">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-3">
                    <Wallet className="w-10 h-10 text-blue-500" />
                    Admin Wallet
                </h1>
                <p className="text-slate-400 text-lg">Manage internal funds and view transaction history.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance Card - Premium Gradient */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet className="w-32 h-32 transform rotate-12" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-blue-100 font-medium tracking-wide text-sm uppercase">Total Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-black tracking-tighter mb-2">
                                ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-blue-200 text-sm flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Available for transfer
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-6 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                                    onClick={async () => {
                                        if (!confirm("Mint 1,000 THB to Admin Wallet?")) return;
                                        setLoading(true);
                                        try {
                                            await WalletService.simulateTopUp(1000);
                                            toast.success("Minted 1,000 THB!");
                                            fetchWallet();
                                        } catch (e) {
                                            toast.error("Mint failed: " + e.message);
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    + Mint 1k
                                </Button>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Quick Stats or Info could go here */}
                    <Card className="bg-slate-900/50 backdrop-blur-md border-slate-800/50 text-slate-300">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-400">System Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Network</span>
                                <span className="text-green-400 font-bold">Online</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Currency</span>
                                <span className="text-white">THB (Thai Baht)</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transfer Form - Glassmorphism */}
                <Card className="lg:col-span-2 bg-slate-950/70 backdrop-blur-xl border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Transfer Funds</CardTitle>
                        <CardDescription className="text-slate-400">Send internal credits to users or businesses securely.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTransfer} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Recipient Wallet / User ID</Label>
                                    <Input
                                        className="bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-white font-mono"
                                        placeholder="e.g. 5d5a..."
                                        value={recipientId}
                                        onChange={e => setRecipientId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Amount (฿)</Label>
                                    <Input
                                        className="bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-white font-mono text-lg"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    disabled={transferring}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                                >
                                    {transferring ? (
                                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                    ) : (
                                        <Send className="w-5 h-5 mr-2" />
                                    )}
                                    <span className="font-bold text-lg">Send Funds</span>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History - Elegant List */}
            <Card className="bg-slate-950/40 backdrop-blur-md border-slate-800/50 shadow-2xl mt-8">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 pb-6">
                    <div>
                        <CardTitle className="text-xl text-white">Recent Transactions</CardTitle>
                        <CardDescription className="text-slate-400 mt-1">History of all incoming and outgoing moves.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchWallet} className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        {history.length === 0 ? (
                            <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
                                    <RefreshCw className="w-8 h-8 opacity-20" />
                                </div>
                                <p>No transactions found</p>
                            </div>
                        ) : (
                            history.map(tx => (
                                <div key={tx.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${tx.type === 'transfer' && tx.to_wallet_id !== 'SELF'
                                            ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                                            }`}>
                                            {tx.type === 'transfer' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-200">{tx.description || 'Transfer'}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5 opacity-70">
                                                {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-mono font-bold text-lg tracking-tight ${tx.type === 'transfer' && tx.to_wallet_id !== 'SELF'
                                        ? 'text-red-400'
                                        : 'text-emerald-400'
                                        }`}>
                                        {tx.type === 'transfer' && tx.to_wallet_id !== 'SELF' ? '-' : '+'}
                                        ฿{Number(tx.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
