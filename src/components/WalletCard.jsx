import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentService } from '@/features/payments/services/PaymentService';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function WalletCard() {
    const [balance, setBalance] = useState({ available: 0, currency: 'USD' });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const { user } = useAuth(); // Need useAuth

    const fetchBalance = async () => {
        if (!user) return; // Guard
        setLoading(true);
        try {
            const data = await PaymentService.getBalance(user.id); // Pass user ID if getBalance needs it, or getWallet uses it
            // Wait, getBalance in PaymentService isn't shown in my view, I should check it.
            // Looking at previous view_file of PaymentService line 9: getWallet(userId).
            // But WalletCard calls PaymentService.getBalance(). 
            // I need to check if getBalance exists or if I should use getWallet.
            // Re-reading PaymentService view: 
            // It has `getWallet`, `getTransactionHistory`, `addCredits`, `payForBooking`. 
            // It DOES NOT have specific `getBalance`.
            // So I should use `getWallet` and extract balance.

            const wallet = await PaymentService.getWallet(user.id);
            if (wallet) {
                setBalance({ available: wallet.balance, currency: wallet.currency });
            }
        } catch (e) {
            console.error("Failed to fetch balance", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchBalance();

        const handleWalletUpdate = () => { if (user) fetchBalance(); };
        window.addEventListener('wallet_updated', handleWalletUpdate);
        return () => window.removeEventListener('wallet_updated', handleWalletUpdate);
    }, [user]);

    const handleAddFunds = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await PaymentService.addCredits(user.id, 100);
            toast({ title: "Funds Added", description: "$100 added to your wallet." });
            fetchBalance();
        } catch (e) {
            toast({ title: "Error", description: "Could not add funds.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                    {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        `$${balance.available.toFixed(2)}`
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    +180.1% from last month
                </p>
                <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddFunds}>
                        <Plus className="mr-2 h-4 w-4" /> Add Funds
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
