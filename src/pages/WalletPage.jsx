import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, QrCode, ArrowUpRight, ArrowDownLeft, History, RefreshCcw, CreditCard, Plus, Send, X } from 'lucide-react';
import { WalletService } from '@/services/WalletService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import QRCode from 'react-qr-code';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const isTransfer = txn.type === 'transfer';

    return (
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-lg">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} ${isPending ? 'bg-yellow-100 text-yellow-600' : ''}`}>
                    {isPending ? <History size={20} /> : (isTransfer ? <Send size={20} className={isCredit ? "rotate-180" : ""} /> : (isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />))}
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
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Modal States
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);

    // Transfer Form
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            const [walletData, txnsData, cardsData] = await Promise.all([
                WalletService.getWallet(),
                WalletService.getTransactions(),
                WalletService.getPaymentMethods()
            ]);
            setWallet(walletData);
            setTransactions(txnsData || []);
            setCards(cardsData || []);
        } catch (error) {
            console.error("Wallet Load Error:", error);
            // Don't show toast on initial load error to avoid spam if auth is checking
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleTopUp = async () => {
        try {
            await WalletService.initiateTopUp(1000.00);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Top Up Failed",
                description: error.message
            });
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setIsTransferring(true);
        try {
            if (!recipientId || !amount) throw new Error("Please fill in all fields");
            if (parseFloat(amount) <= 0) throw new Error("Amount must be positive");

            await WalletService.transferFunds(recipientId, parseFloat(amount), transferNote);

            toast({
                title: "Transfer Successful! 💸",
                description: `Sent ${amount} THB to recipient.`,
            });
            setIsTransferOpen(false);
            setAmount('');
            setRecipientId('');
            setTransferNote('');
            await fetchWalletData(); // Refresh balance
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Transfer Failed",
                description: error.message
            });
        } finally {
            setIsTransferring(false);
        }
    };

    // Check for payment return
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.get('session_id') && !query.get('processed')) {
            toast({
                title: "Payment Processing",
                description: "Verifying your top-up...",
            });
            setTimeout(() => fetchWalletData(), 3000);
            setTimeout(() => fetchWalletData(), 6000);
        }
        if (query.get('canceled')) {
            toast({
                variant: "destructive",
                title: "Top Up Canceled",
                description: "You canceled the payment."
            });
        }
    }, [navigate]); // Added dependency to suppress eslint warning

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-24 md:p-8">
            <div className="max-w-xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold font-['Outfit'] text-slate-900 dark:text-white">Kosmoi Pay</h1>
                    <Button variant="ghost" size="icon" onClick={fetchWalletData} disabled={loading}>
                        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>

                {/* Hero Card - Balance */}
                <GlassCard className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 border-none shadow-xl text-white p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-center transform transition-transform hover:scale-[1.01]">
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />

                    <div className="relative z-10 flex flex-col gap-2">
                        <span className="text-blue-100 text-sm font-medium flex items-center gap-2 opacity-80">
                            <Wallet size={18} /> Current Balance
                        </span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <h2 className="text-5xl font-bold font-['Outfit'] tracking-tight">
                                {wallet ? parseFloat(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '---'}
                            </h2>
                            <span className="text-2xl font-medium text-blue-200">THB</span>
                        </div>
                        {wallet?.status === 'active' && (
                            <div className="flex items-center gap-2 mt-6 text-xs bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                Active Wallet
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-4">
                    <ActionButton
                        icon={QrCode}
                        label="Scan"
                        onClick={() => setIsTransferOpen(true)}
                        colorClass="bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
                    />
                    <ActionButton
                        icon={ArrowUpRight}
                        label="Top Up"
                        onClick={handleTopUp}
                        colorClass="bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
                    />
                    <ActionButton
                        icon={ArrowDownLeft}
                        label="Request"
                        onClick={() => setIsReceiveOpen(true)}
                        colorClass="bg-purple-500 hover:bg-purple-600 shadow-purple-500/20"
                    />
                    <ActionButton
                        icon={CreditCard}
                        label="Card"
                        onClick={() => toast({ title: "Virtual Card", description: "Manage your virtual Kosmoi Card." })}
                        colorClass="bg-pink-500 hover:bg-pink-600 shadow-pink-500/20"
                    />
                </div>

                {/* Saved Cards */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Payment Methods</h3>
                        <Button variant="outline" size="sm" onClick={() => WalletService.initiateCardSetup()}>
                            <Plus size={16} className="mr-2" /> Add Card
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {cards.length > 0 ? (
                            cards.map((card) => (
                                <GlassCard key={card.id} className="flex items-center justify-between p-4 bg-white/80 dark:bg-black/40">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-full">
                                            <CreditCard size={20} className="text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold capitalize">{card.brand} •••• {card.last4}</p>
                                            <p className="text-xs text-slate-500">Expires {card.exp_month}/{card.exp_year}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10">Saved</Badge>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center py-6 text-slate-500">
                                <p className="text-sm">No saved cards linked.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h3>
                        <Button variant="link" className="text-blue-600 p-0 h-auto font-medium">View All</Button>
                    </div>

                    <GlassCard className="bg-white/80 dark:bg-black/40 min-h-[300px] backdrop-blur-sm border border-slate-200/50 dark:border-white/5">
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
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center px-6">
                                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-full mb-4">
                                    <History size={24} />
                                </div>
                                <p className="font-medium text-slate-600 dark:text-slate-300">No transactions yet</p>
                                <p className="text-sm mt-1">Transactions will appear here once you start using your wallet.</p>
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* --- MODALS --- */}

                {/* 1. Receive Money (QR) */}
                <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-center text-xl">My Wallet QR</DialogTitle>
                            <DialogDescription className="text-center">
                                Scan this code to receive money instantly.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border border-slate-100 shadow-inner">
                            {wallet?.id && (
                                // <QRCode 
                                //     value={wallet.id} 
                                //     size={200}
                                //     className="h-auto w-full max-w-[200px]"
                                // />
                                <div className="h-48 w-48 bg-slate-100 flex items-center justify-center rounded-lg border border-slate-200">
                                    <span className="text-slate-400 text-xs">QR Code Placeholder (Debug)</span>
                                </div>
                            )}
                            <p className="mt-4 text-xs font-mono text-slate-400 break-all text-center max-w-[200px]">
                                {wallet?.id}
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button type="button" variant="secondary" onClick={() => setIsReceiveOpen(false)}>
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 2. Send Money (Transfer) */}
                <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle>Transfer Funds</DialogTitle>
                            <DialogDescription>
                                Enter recipient's Wallet ID to send money.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleTransfer} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="walletId">Recipient Wallet ID</Label>
                                <Input
                                    id="walletId"
                                    placeholder="Enter UUID..."
                                    value={recipientId}
                                    onChange={(e) => setRecipientId(e.target.value)}
                                    required
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (THB)</Label>
                                <div className="relative">
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        className="pl-4 text-lg font-semibold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">THB</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Note (Optional)</Label>
                                <Input
                                    id="note"
                                    placeholder="What is this for?"
                                    value={transferNote}
                                    onChange={(e) => setTransferNote(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isTransferring}>
                                    {isTransferring ? "Sending..." : "Send Money"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}
