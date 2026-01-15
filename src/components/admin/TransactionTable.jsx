import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminService } from '@/services/AdminService';
import { Loader2, Search, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

export default function TransactionTable() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCurrency, setFilterCurrency] = useState("ALL");
    const [filterType, setFilterType] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Use AdminService to get GLOBAL transactions, not just personal wallet
            const { data } = await AdminService.getAllTransactions();
            setTransactions(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        if (filterCurrency !== "ALL" && tx.currency !== filterCurrency) return false;
        if (filterType !== "ALL" && tx.type !== filterType) return false;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const searchString = `${tx.description || ''} ${tx.from_wallet_id || ''} ${tx.to_wallet_id || ''}`.toLowerCase();
            if (!searchString.includes(term)) return false;
        }

        return true;
    });

    const getCurrencyBadge = (curr) => {
        if (curr === 'VIBES') return <Badge variant="secondary" className="bg-pink-500/10 text-pink-500 border-pink-500/20">VIBES</Badge>;
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">THB</Badge>;
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'transfer': return <Badge variant="outline" className="border-slate-600">Transfer</Badge>;
            case 'deposit': return <Badge variant="outline" className="border-green-600 text-green-500">Deposit</Badge>;
            case 'withdrawal': return <Badge variant="outline" className="border-red-600 text-red-500">Withdrawal</Badge>;
            default: return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-8 bg-slate-900/50 border-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchTransactions}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                        <SelectTrigger className="w-[120px] bg-slate-900/50 border-slate-700">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Currencies</SelectItem>
                            <SelectItem value="THB">THB</SelectItem>
                            <SelectItem value="VIBES">VIBES</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[120px] bg-slate-900/50 border-slate-700">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/30 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="border-slate-800 hover:bg-slate-900/50">
                            <TableHead className="text-slate-400">Date</TableHead>
                            <TableHead className="text-slate-400">Description</TableHead>
                            <TableHead className="text-slate-400">Type</TableHead>
                            <TableHead className="text-slate-400">Amount</TableHead>
                            <TableHead className="text-slate-400">Currency</TableHead>
                            <TableHead className="text-slate-400 text-right">Reference</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-900/50">
                                    <TableCell className="font-mono text-xs text-slate-400">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                        <div className="text-[10px] opacity-70">{new Date(tx.created_at).toLocaleTimeString()}</div>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-200">
                                        {tx.description || 'System Transaction'}
                                        <div className="text-xs text-slate-500 overflow-hidden text-ellipsis w-48 whitespace-nowrap">
                                            {tx.from_wallet_id || tx.metadata?.sender_wallet || tx.metadata?.sender_user_id || '?'} → {tx.to_wallet_id || tx.metadata?.recipient_wallet || tx.metadata?.recipient_user_id || '?'}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getTypeBadge(tx.type)}</TableCell>
                                    <TableCell className="font-mono font-bold">
                                        {Number(tx.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getCurrencyBadge(tx.currency)}</TableCell>
                                    <TableCell className="text-right font-mono text-xs text-slate-500">
                                        {tx.id.slice(0, 8)}...
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-slate-500 text-right">
                Showing {filteredTransactions.length} results
            </div>
        </div>
    );
}
