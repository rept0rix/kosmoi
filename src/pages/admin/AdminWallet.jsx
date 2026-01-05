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
            const wallet = await WalletService.createWallet(user.id);
            setBalance(wallet.balance || 0);

            // Get history
            const txs = await WalletService.getHistory(wallet.id);
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
            await WalletService.transfer(user.id, recipientId, parseFloat(amount), "Admin Transfer");
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-8 h-8 text-blue-500" />
                Admin Wallet
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <Card className="bg-slate-900 border-slate-800 text-white md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-400">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            ฿{balance.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Available for transfer</p>
                    </CardContent>
                </Card>

                {/* Transfer Form */}
                <Card className="bg-slate-900 border-slate-800 text-white md:col-span-2">
                    <CardHeader>
                        <CardTitle>Transfer Funds</CardTitle>
                        <CardDescription>Send internal credits to users or businesses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTransfer} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Recipient User ID (UUID)</Label>
                                <Input
                                    className="bg-slate-950 border-slate-700"
                                    placeholder="e.g. 5d5a..."
                                    value={recipientId}
                                    onChange={e => setRecipientId(e.target.value)}
                                />
                            </div>
                            <div className="w-32 space-y-2">
                                <Label>Amount (฿)</Label>
                                <Input
                                    className="bg-slate-950 border-slate-700"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <Button disabled={transferring} className="bg-blue-600 hover:bg-blue-700">
                                {transferring ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4 mr-2" />}
                                Send
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm" onClick={fetchWallet}><RefreshCw className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center text-slate-500 py-8">No transactions found</div>
                        ) : (
                            history.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.to_wallet_id ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {tx.type === 'transfer' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-200">{tx.description || 'Transfer'}</div>
                                            <div className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className={`font-mono font-bold ${tx.type === 'transfer' ? 'text-white' : 'text-green-400'}`}>
                                        {tx.type === 'transfer' ? '-' : '+'}฿{Number(tx.amount).toLocaleString()}
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
