import React, { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Keep sub-components if needed or replace structure
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletService } from "@/services/WalletService";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  Loader2,
  Send,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/api/supabaseClient";
import KosmoiLoader from "@/components/ui/KosmoiLoader";

import TransactionTable from "@/components/admin/TransactionTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function AdminWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [vibesBalance, setVibesBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Transfer State
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("THB");

  const fetchWallet = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Ensure wallet exists
      const wallet = await WalletService.getWallet();
      setBalance(wallet.balance || 0);
      setVibesBalance(wallet.vibes_balance || 0);

      // Get history
      const txs = await WalletService.getTransactions();
      setHistory(txs || []);
    } catch (error) {
      console.error("Wallet Error:", error);
      // toast.error("Failed to load wallet data."); // Suppress initial load error if wallet sends 404/etc handled inside service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWallet();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!amount || !recipientId) return;

    setTransferring(true);
    try {
      await WalletService.transferFunds(
        recipientId,
        parseFloat(amount),
        currency,
        "Admin Transfer",
      );
      toast.success("Transfer successful!");
      setAmount("");
      setRecipientId("");
      fetchWallet(); // Refresh
    } catch (error) {
      console.error(error);
      toast.error("Transfer failed: " + error.message);
    } finally {
      setTransferring(false);
    }
  };

  if (loading && user)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <KosmoiLoader />
      </div>
    );

  // Temporary Debug Banner
  const claimAdmin = async () => {
    const { error } = await supabase.rpc("dev_claim_admin");
    if (error) toast.error(error.message);
    else {
      toast.success("Admin access claimed! Reloading...");
      window.location.reload();
    }
  };

  const debugInfo = (
    <div className="bg-yellow-500/10 text-yellow-200 p-2 text-xs font-mono mb-4 rounded border border-yellow-500/20 flex justify-between items-center backdrop-blur-sm">
      <span>
        DEBUG: User ID: {user?.id} | Email: {user?.email} | Role: {user?.role}
      </span>
      {user && user.role !== "admin" && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-200"
          onClick={claimAdmin}
        >
          Fix Admin Access
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-2 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            SYSTEM{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              WALLET
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">// TREASURY_LEDGER</p>
        </div>
      </div>

      {debugInfo}

      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="bg-slate-900/50 border border-white/5 p-1 mb-8 rounded-xl backdrop-blur-md">
          <TabsTrigger
            value="wallet"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 font-mono text-xs tracking-wider"
          >
            MY_ASSETS
          </TabsTrigger>
          <TabsTrigger
            value="global"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20 font-mono text-xs tracking-wider"
          >
            GLOBAL_LEDGER
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Balance Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* THB Card */}
              <GlassCard
                variant="default"
                className="border-blue-500/30 bg-blue-600/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="w-32 h-32 transform rotate-12 text-blue-400" />
                </div>
                <div className="relative z-10">
                  <div className="text-blue-300 font-mono text-xs uppercase tracking-widest mb-2">
                    Total Balance (THB)
                  </div>
                  <div className="text-5xl font-black tracking-tighter mb-4 text-white text-shadow-glow-blue">
                    ฿
                    {balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-blue-200">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      LIQUIDITY_AVAILABLE
                    </div>
                    <NeonButton
                      variant="blue"
                      size="sm"
                      className="h-7 text-[10px]"
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
                      + MINT
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>

              {/* Vibes Card */}
              <GlassCard
                variant="default"
                className="border-pink-500/30 bg-pink-600/10 relative overflow-hidden group"
              >
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-15 transition-opacity">
                  <TrendingUp className="w-24 h-24 text-pink-400" />
                </div>
                <div className="relative z-10">
                  <div className="text-pink-300 font-mono text-xs uppercase tracking-widest mb-2">
                    Vibes Balance
                  </div>
                  <div className="text-4xl font-black tracking-tighter mb-2 text-white text-shadow-glow-pink">
                    {vibesBalance.toLocaleString()}{" "}
                    <span className="text-lg opacity-80 font-normal">
                      VIBES
                    </span>
                  </div>
                  <p className="text-pink-200/60 text-xs font-mono">
                    LOYALTY_MATRIX
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Transfer Form */}
            <GlassCard className="lg:col-span-2 flex flex-col justify-center">
              <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-neon-cyan" />
                  Fund Transfer Protocol
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Initiate secure transfer to user wallets.
                </p>
              </div>

              <form onSubmit={handleTransfer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-mono uppercase">
                      Recipient UUID
                    </Label>
                    <Input
                      className="bg-black/40 border-slate-800 focus:border-neon-cyan focus:ring-neon-cyan/20 text-white font-mono placeholder:text-slate-700"
                      placeholder="User UUID..."
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-mono uppercase">
                      Amount
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className="bg-black/40 border-slate-800 focus:border-neon-cyan focus:ring-neon-cyan/20 text-white font-mono text-lg flex-1 placeholder:text-slate-700"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <select
                        className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 w-24 focus:ring-neon-cyan focus:border-neon-cyan font-mono"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="THB">THB</option>
                        <option value="VIBES">VIBES</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <NeonButton
                    disabled={transferring}
                    variant={currency === "VIBES" ? "pink" : "cyan"}
                    size="lg"
                    className="w-full md:w-auto"
                  >
                    {transferring ? (
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-bold">EXECUTE TRANSFER</span>
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </div>

          {/* Transaction History */}
          <GlassCard className="p-0 overflow-hidden mt-8">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Recent Activity
                </h3>
                <p className="text-slate-400 text-xs font-mono">
                  My Wallet Ledger
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchWallet}
                className="text-slate-400 hover:text-white hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="p-0">
              <div className="space-y-0 divide-y divide-white/5">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 opacity-20 mb-3" />
                    <p className="font-mono text-xs">NO_DATA_FOUND</p>
                  </div>
                ) : (
                  history.map((tx) => (
                    <div
                      key={tx.id}
                      className="group flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            tx.type === "transfer" && tx.to_wallet_id !== "SELF"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {tx.type === "transfer" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200 text-sm">
                            {tx.description || "Transfer"}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 opacity-70">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-mono font-bold text-sm tracking-tight ${
                          tx.type === "transfer" && tx.to_wallet_id !== "SELF"
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {tx.type === "transfer" && tx.to_wallet_id !== "SELF"
                          ? "-"
                          : "+"}
                        {tx.currency === "VIBES"
                          ? " " + Number(tx.amount).toLocaleString() + " VIBES"
                          : " ฿" + Number(tx.amount).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="global">
          <TransactionTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
