import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminService } from "@/services/AdminService";
import {
  Loader2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TransactionTable({
  initialData = null,
  isLoading: externalLoading = undefined,
}) {
  const [internalTransactions, setInternalTransactions] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [filterCurrency, setFilterCurrency] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Determine source of truth
  const transactions = initialData || internalTransactions;
  const loading =
    externalLoading !== undefined ? externalLoading : internalLoading;

  const fetchTransactions = async () => {
    if (initialData) return; // Don't fetch if we have external data

    setInternalLoading(true);
    try {
      // Use AdminService to get GLOBAL transactions, not just personal wallet
      const { data } = await AdminService.getAllTransactions();
      setInternalTransactions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchTransactions();
    }
  }, [initialData]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterCurrency !== "ALL" && tx.currency !== filterCurrency)
      return false;
    if (filterType !== "ALL" && tx.type !== filterType) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const searchString =
        `${tx.description || ""} ${tx.from_wallet_id || ""} ${tx.to_wallet_id || ""}`.toLowerCase();
      if (!searchString.includes(term)) return false;
    }

    return true;
  });

  const getCurrencyBadge = (curr) => {
    if (curr === "VIBES")
      return (
        <Badge
          variant="secondary"
          className="bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20"
        >
          VIBES
        </Badge>
      );
    return (
      <Badge
        variant="secondary"
        className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
      >
        THB
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "transfer":
        return (
          <Badge variant="outline" className="border-slate-600 text-slate-400">
            Transfer
          </Badge>
        );
      case "deposit":
        return (
          <Badge
            variant="outline"
            className="border-emerald-600/50 text-emerald-400 bg-emerald-500/5"
          >
            Deposit
          </Badge>
        );
      case "withdrawal":
        return (
          <Badge
            variant="outline"
            className="border-red-600/50 text-red-400 bg-red-500/5"
          >
            Withdrawal
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-700 text-slate-500">
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neon-cyan/50" />
            <Input
              placeholder="Search transactions..."
              className="pl-9 bg-black/20 border-white/5 focus:border-neon-cyan focus:ring-neon-cyan/20 text-white placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchTransactions}
            className="border-white/5 bg-black/20 hover:bg-white/10 hover:text-neon-cyan text-slate-400"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-[140px] bg-black/20 border-white/5 text-slate-300">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="ALL">All Currencies</SelectItem>
              <SelectItem value="THB">THB</SelectItem>
              <SelectItem value="VIBES">VIBES</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] bg-black/20 border-white/5 text-slate-300">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Description
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Amount
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Currency
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider text-right">
                Reference
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-neon-cyan" />
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <Search className="w-8 h-8 mb-2" />
                    <p className="font-mono text-xs">NO_TRANSACTIONS_FOUND</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  <TableCell className="font-mono text-xs text-slate-400 group-hover:text-slate-200">
                    {new Date(tx.created_at).toLocaleDateString()}
                    <div className="text-[10px] opacity-50">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-300 group-hover:text-neon-cyan transition-colors">
                    {tx.description || "System Transaction"}
                    <div className="text-[10px] text-slate-600 font-mono overflow-hidden text-ellipsis w-48 whitespace-nowrap mt-0.5">
                      {tx.from_wallet_id ||
                        tx.metadata?.sender_wallet ||
                        tx.metadata?.sender_user_id ||
                        "?"}{" "}
                      →{" "}
                      {tx.to_wallet_id ||
                        tx.metadata?.recipient_wallet ||
                        tx.metadata?.recipient_user_id ||
                        "?"}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(tx.type)}</TableCell>
                  <TableCell className="font-mono font-bold text-sm">
                    {Number(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>{getCurrencyBadge(tx.currency)}</TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-slate-600 group-hover:text-slate-400">
                    {tx.id.slice(0, 8)}...
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      <div className="text-xs text-slate-600 text-right font-mono">
        DATA_ENTITIES: {filteredTransactions.length}
      </div>
    </div>
  );
}
