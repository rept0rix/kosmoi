import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentService } from '@/services/PaymentService';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function WalletCard() {
    const [balance, setBalance] = useState({ available: 0, currency: 'USD' });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const data = await PaymentService.getBalance();
            setBalance(data);
        } catch (e) {
            console.error("Failed to fetch balance", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();

        // Listen for custom event 'wallet_updated' to refresh balance from other components
        const handleWalletUpdate = () => fetchBalance();
        window.addEventListener('wallet_updated', handleWalletUpdate);
        return () => window.removeEventListener('wallet_updated', handleWalletUpdate);
    }, []);

    const handleAddFunds = async () => {
        await PaymentService.addCredits(100);
        toast({ title: "Funds Added", description: "$100 added to your wallet." });
        fetchBalance();
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
