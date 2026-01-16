
import React, { useEffect, useState } from 'react';
import { AdminService } from '@/services/AdminService';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Filter,
    MoreHorizontal,
    User,
    Phone,
    Mail,
    MessageSquare,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    ArrowUpRight
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import KosmoiLoader from '@/components/ui/KosmoiLoader';

export default function AdminCRM() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        const { data, error } = await AdminService.getLeads();
        if (error) {
            toast({
                title: "Error fetching leads",
                description: error.message,
                variant: "destructive"
            });
        }
        setLeads(data || []);
        setLoading(false);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await AdminService.updateLeadStatus(id, newStatus);
            toast({
                title: "Status Updated",
                description: `Lead marked as ${newStatus}`,
            });
            loadLeads();
        } catch (error) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'new': return <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>;
            case 'contacted': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Contacted</Badge>;
            case 'qualified': return <Badge className="bg-purple-500 hover:bg-purple-600">Qualified</Badge>;
            case 'closed': return <Badge className="bg-green-500 hover:bg-green-600">Closed (Won)</Badge>;
            case 'lost': return <Badge variant="destructive">Lost</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredLeads = leads.filter(lead =>
        (lead.interest || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.source || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><KosmoiLoader /></div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Sales CRM
                </h1>
                <p className="text-slate-400">Manage leads and opportunities from the Concierge</p>
            </div>

            {/* Stats Check */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900/40 border-white/5 backdrop-blur-sm">
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Leads</div>
                    <div className="text-2xl font-bold text-white">{leads.length}</div>
                </Card>
                <Card className="p-4 bg-slate-900/40 border-white/5 backdrop-blur-sm">
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">New Opportunities</div>
                    <div className="text-2xl font-bold text-blue-400">{leads.filter(l => l.status === 'new').length}</div>
                </Card>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-lg border border-white/5 flex justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search interest..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                    />
                </div>
                <Button onClick={loadLeads} variant="outline" className="border-white/10 hover:bg-white/5">Refresh</Button>
            </div>

            <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-slate-400">Date</TableHead>
                            <TableHead className="text-slate-400">Interest / Source</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400">Notes</TableHead>
                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.length === 0 ? (
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    No leads found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLeads.map((lead) => (
                                <TableRow key={lead.id} className="hover:bg-white/5 border-white/5">
                                    <TableCell className="text-slate-400 font-mono text-xs">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-200">{lead.interest || "General Inquiry"}</div>
                                        <div className="text-xs text-slate-500 capitalize">{lead.source}</div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(lead.status)}
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                                        {lead.notes || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                {['new', 'contacted', 'qualified', 'closed', 'lost'].map(s => (
                                                    <DropdownMenuItem
                                                        key={s}
                                                        onClick={() => handleUpdateStatus(lead.id, s)}
                                                        className="capitalize hover:bg-slate-800 cursor-pointer"
                                                    >
                                                        {s}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
