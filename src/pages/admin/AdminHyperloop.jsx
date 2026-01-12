
import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Bot, Globe, Mail, Terminal, Wifi } from 'lucide-react';

const AdminHyperloop = () => {
    const [crawlerLogs, setCrawlerLogs] = useState([]);
    const [salesLogs, setSalesLogs] = useState([]);
    const [lastHeartbeat, setLastHeartbeat] = useState(new Date());

    // Polling for live updates
    useEffect(() => {
        const fetchData = async () => {
            // Fetch recent crawler additions
            const { data: crawlerData } = await supabase
                .from('service_providers')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (crawlerData) setCrawlerLogs(crawlerData);

            // Fetch recent invitations
            const { data: inviteData } = await supabase
                .from('invitations')
                .select('*, service_providers(business_name)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (inviteData) setSalesLogs(inviteData);
            setLastHeartbeat(new Date());
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // 5s poll
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Agent Mission Control ("Hyperloop")
                </h1>
                <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-400 border-green-500/50">
                    <Wifi className="w-3 h-3 mr-2" />
                    System Online
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Crawler Stream */}
                <Card className="bg-slate-900/50 border-white/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center text-blue-400">
                            <Globe className="w-5 h-5 mr-2" />
                            Island Crawler Stream
                        </CardTitle>
                        <CardDescription>Live intake from remote crawlers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {crawlerLogs.map((log) => (
                                    <div key={log.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-sky-300">{log.business_name}</span>
                                            <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">{log.category}</Badge>
                                            <span className="text-slate-400">{log.location}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Sales Stream */}
                <Card className="bg-slate-900/50 border-white/10 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center text-purple-400">
                            <Bot className="w-5 h-5 mr-2" />
                            Sales Agent ("Sarah")
                        </CardTitle>
                        <CardDescription>Outbound invitations & leads</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {salesLogs.map((log) => (
                                    <div key={log.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1 transition-all hover:bg-white/10">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-purple-300">
                                                Invited: {log.service_providers?.business_name || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="p-2 mt-2 rounded bg-black/30 text-xs font-mono text-slate-400 border border-white/5">
                                            {log.metadata?.target_message || 'Drafting message...'}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <Terminal className="w-3 h-3 text-slate-600" />
                                            <span className="text-[10px] text-slate-600">ID: {log.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Latency Footer */}
            <div className="fixed bottom-4 right-4 text-xs text-slate-600 font-mono">
                Last Sync: {lastHeartbeat.toLocaleTimeString()} | Node: Rept0rix-Main
            </div>
        </div>
    );
};

export default AdminHyperloop;
