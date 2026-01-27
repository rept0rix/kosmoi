import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletService } from "@/services/WalletService";
import { StripeService } from "@/services/payments/StripeService";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import TransactionTable from "@/components/admin/TransactionTable";

export function FinanceView({ provider }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState(null); // 'checking', 'connected', 'not_connected'

  useEffect(() => {
    loadFinancials();
  }, [provider]);

  const loadFinancials = async () => {
    if (!provider?.owner_id) return;
    setLoading(true);
    try {
      // 1. Load Wallet & Transactions
      const [walletData, txnsData] = await Promise.all([
        WalletService.getWallet(),
        WalletService.getTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(txnsData || []);

      // 2. Check Stripe Status (mocked or real if available)
      if (provider.stripe_account_id) {
        setStripeStatus("connected"); // Simplified logic
      } else {
        setStripeStatus("not_connected");
      }
    } catch (error) {
      console.error("Failed to load financials", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      await StripeService.createConnectAccount(provider.id);
    } catch (error) {
      console.error("Stripe Connect Failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 pb-20 max-w-5xl mx-auto space-y-8">
      {/* Header / Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                ฿ {wallet?.balance?.toLocaleString() || "0"}
              </span>
              <span className="text-sm text-slate-400">THB</span>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                disabled
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-0"
              >
                <DollarSign className="w-4 h-4 mr-2" /> Withdraw
              </Button>
              <Button
                disabled
                variant="outline"
                className="border-white/20 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect Card */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Payout System
              {stripeStatus === "connected" && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Powered by Stripe Connect</CardDescription>
          </CardHeader>
          <CardContent>
            {stripeStatus === "connected" ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-500">
                  Your account is connected to Stripe. Payouts are automatic
                  based on your schedule.
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open("https://dashboard.stripe.com", "_blank")
                  }
                >
                  Stripe Dashboard <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-500">
                  Connect your bank account to receive payouts directly.
                </div>
                <Button
                  onClick={handleConnectStripe}
                  className="w-full bg-[#635BFF] hover:bg-[#5851E1] text-white"
                >
                  Connect with Stripe <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions History */}
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <TransactionTable initialData={transactions} isLoading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
