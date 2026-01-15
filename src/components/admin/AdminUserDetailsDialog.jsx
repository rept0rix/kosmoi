
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, Building2, Wallet, Activity, User, ExternalLink } from 'lucide-react';
import { AdminService } from '@/services/AdminService';
import { ActivityLogService } from '@/services/ActivityLogService';
import { toast } from "@/components/ui/use-toast";

export default function AdminUserDetailsDialog({ isOpen, onClose, userId }) {
    const [details, setDetails] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadData(userId);
        } else {
            setDetails(null);
            setLogs([]);
        }
    }, [isOpen, userId]);

    const loadData = async (id) => {
        setLoading(true);
        const data = await AdminService.getUserDetails(id);
        if (data.error) {
            toast({
                title: "Error Loading Details",
                description: data.error.message,
                variant: "destructive"
            });
        } else {
            setDetails(data);
            // Load logs immediately as well? Or lazy load? Let's lazy load on tab switch or just load now.
            // Let's load now for smoother UX
            loadLogs(id);
        }
        setLoading(false);
    };

    const loadLogs = async (id) => {
        setLogsLoading(true);
        const { data } = await ActivityLogService.getLogsByUser(id);
        setLogs(data || []);
        setLogsLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", duration: 1500 });
    };

    if (!userId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" />
                        User Details
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : !details?.user ? (
                        <div className="text-center text-slate-500 py-10">User not found.</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Header / Profile Card */}
                            <div className="flex items-start gap-6">
                                <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-800 shadow-lg">
                                    <AvatarImage src={details.user.avatar_url} />
                                    <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                                        {details.user.full_name?.charAt(0) || details.user.email?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                                        {details.user.full_name || "Unknown User"}
                                        <Badge variant={details.user.role === 'admin' ? 'default' : 'secondary'} className="ml-2">
                                            {details.user.role || 'user'}
                                        </Badge>
                                    </h2>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <span>{details.user.email}</span>
                                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => copyToClipboard(details.user.email)}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-mono bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded w-fit">
                                        ID: {details.user.id}
                                        <Copy className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={() => copyToClipboard(details.user.id)} />
                                    </div>
                                    <div className="text-xs text-slate-400 pt-1">
                                        Joined: {new Date(details.user.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="overview">
                                        <Building2 className="w-4 h-4 mr-2" /> Business
                                    </TabsTrigger>
                                    <TabsTrigger value="finance">
                                        <Wallet className="w-4 h-4 mr-2" /> Finance
                                    </TabsTrigger>
                                    <TabsTrigger value="activity">
                                        <Activity className="w-4 h-4 mr-2" /> Activity Log
                                    </TabsTrigger>
                                </TabsList>

                                {/* Business Tab */}
                                <TabsContent value="overview" className="space-y-4">
                                    {details.business ? (
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                <CardTitle className="text-sm font-medium">Business Profile</CardTitle>
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center gap-4 mb-4">
                                                    {details.business.logo_url && (
                                                        <img src={details.business.logo_url} alt="Logo" className="w-16 h-16 rounded object-cover border" />
                                                    )}
                                                    <div>
                                                        <div className="text-xl font-bold">{details.business.business_name}</div>
                                                        <Badge variant="outline" className="mt-1">{details.business.category}</Badge>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                    <div>
                                                        <span className="text-slate-500 block">Status:</span>
                                                        <span className={details.business.status === 'active' ? 'text-green-500 font-medium' : 'text-yellow-500'}>
                                                            {details.business.status?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block">Verified:</span>
                                                        <span>{details.business.verified ? '✅ Yes' : '❌ No'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block">Location:</span>
                                                        <span>{details.business.location || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                {/* Requires AdminBusinesses route/dialog access, usually manual. For now just show ID */}
                                                <div className="text-xs text-slate-400 font-mono">
                                                    Business ID: {details.business.id}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-slate-400">
                                            <Building2 className="w-12 h-12 mb-3 opacity-20" />
                                            <p>No business profile linked to this user.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Finance Tab */}
                                <TabsContent value="finance" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                                                <Wallet className="w-4 h-4 text-emerald-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">
                                                    {details.wallet?.balance?.toLocaleString() || 0} THB
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    VIBES: {details.wallet?.vibes_balance || 0}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                <CardTitle className="text-sm font-medium">Stripe Status</CardTitle>
                                                <ExternalLink className="w-4 h-4 text-blue-500" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-lg font-bold">
                                                    {details.business?.stripe_account_id ? 'Connected' : 'Not Connected'}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-[150px]">
                                                    {details.business?.stripe_account_id || 'No Account ID'}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    {/* Could add transaction history specifically for this user here later */}
                                </TabsContent>

                                {/* Activity Tab (Logs) */}
                                <TabsContent value="activity">
                                    <Card className="border-0 shadow-none">
                                        <CardContent className="p-0">
                                            <ScrollArea className="h-[400px] w-full pr-4">
                                                {logsLoading ? (
                                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                                ) : logs.length === 0 ? (
                                                    <div className="text-center text-slate-400 py-8">No activity recorded.</div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {logs.map((log) => (
                                                            <div key={log.id} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                                                                <div className="flex justify-between mb-1">
                                                                    <span className="font-bold text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                                                        {log.action_type}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">
                                                                        {new Date(log.created_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-700 dark:text-slate-300">{log.description}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
