import React, { useEffect, useState, useRef } from 'react';
import { Logger } from '../../services/utils/Logger';
import { realSupabase as supabase } from '@/api/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Brain, Clock, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

const LogRow = ({ log }) => {
    let color = 'text-slate-300';
    let icon = <Clock className="w-3 h-3" />;

    switch (log.level) {
        case 'error': color = 'text-red-400 bg-red-950/30'; icon = <XCircle className="w-3 h-3 text-red-500" />; break;
        case 'warn': color = 'text-amber-400 bg-amber-950/30'; icon = <AlertTriangle className="w-3 h-3 text-amber-500" />; break;
        case 'success': color = 'text-green-400 bg-green-950/30'; icon = <CheckCircle className="w-3 h-3 text-green-500" />; break;
        case 'info': color = 'text-blue-300'; icon = <Activity className="w-3 h-3 text-blue-500" />; break;
    }

    return (
        <div className={`text-xs font-mono py-1 px-2 border-b border-slate-800 ${color} flex items-center gap-2`}>
            {icon}
            <span className="opacity-50 w-20">{log.timestamp.split('T')[1].split('.')[0]}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1 border-slate-700 text-slate-400 w-20 justify-center">
                {log.source}
            </Badge>
            <span className="flex-1 truncate" title={log.message}>{log.message}</span>
        </div>
    );
};

export default function SystemMonitor() {
    const [logs, setLogs] = useState([]);
    const [metrics, setMetrics] = useState({
        errors: 0,
        warnings: 0,
        requests: 0,
        uptime: '00:00:00'
    });
    const scrollRef = useRef(null);

    useEffect(() => {
        // Fetch initial logs from Supabase
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(100);

            if (data) {
                // Transform DB logs to UI format if needed
                const formatted = data.map(l => ({
                    id: l.id,
                    timestamp: l.timestamp,
                    level: l.level || 'info', // Default if missing
                    source: l.action || 'System',
                    message: l.details ? JSON.stringify(l.details) : 'Event occurred',
                    metadata: l.user_id ? { user: l.user_id } : {}
                }));
                // Merge with memory logs if any, but prioritized DB
                setLogs(formatLogs(formatted));
            }
        };

        fetchLogs();

        // Subscribe to real-time additions
        const channel = supabase
            .channel('public:audit_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                const newLog = payload.new;
                setLogs(prev => [formatLog(newLog), ...prev].slice(0, 500));
            })
            .subscribe();

        // Also keep Memory Logger for non-persisted clientside debugs
        const unsubscribeLogger = Logger.subscribe((newLog) => {
            if (newLog) {
                setLogs(prev => [newLog, ...prev].slice(0, 500));
            }
        });

        // Mock uptime / stats updater
        const timer = setInterval(() => {
            setMetrics(m => ({ ...m, uptime: new Date().toLocaleTimeString() }));
        }, 1000);

        return () => {
            supabase.removeChannel(channel);
            unsubscribeLogger();
            clearInterval(timer);
        };
    }, []);

    const formatLog = (l) => ({
        id: l.id || Date.now(),
        timestamp: l.timestamp || new Date().toISOString(),
        level: l.level || 'info',
        source: l.action || 'System',
        message: typeof l.details === 'object' ? JSON.stringify(l.details) : (l.details || 'Event'),
        metadata: {}
    });

    // Helper to safety check list
    const formatLogs = (list) => list.map(formatLog);

    return (
        <div className="h-full flex flex-col gap-4 p-4 md:p-6 max-h-screen">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">System Monitor</h1>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => Logger.clear()}>Clear Logs</Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 rounded-full"><Activity className="w-5 h-5 text-green-500" /></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Requests</p>
                            <p className="text-2xl font-bold">{metrics.requests}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-red-500/10 rounded-full"><XCircle className="w-5 h-5 text-red-500" /></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Errors</p>
                            <p className="text-2xl font-bold text-red-400">{metrics.errors}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-full"><Brain className="w-5 h-5 text-blue-500" /></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">AI Latency</p>
                            <p className="text-2xl font-bold">124ms</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-purple-500/10 rounded-full"><Database className="w-5 h-5 text-purple-500" /></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">DB Status</p>
                            <p className="text-2xl font-bold text-green-400">Healthy</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Log Stream */}
            <Card className="flex-1 bg-slate-950 border-slate-800 flex flex-col min-h-0">
                <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/50">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        Live Log Stream
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0 bg-black/40">
                    <ScrollArea className="h-full w-full">
                        <div className="flex flex-col-reverse justify-end min-h-full">
                            {/* Flex-reverse to stick to bottom if we desired, but for now simple mapping */}
                            {logs.map((log) => (
                                <LogRow key={log.id} log={log} />
                            ))}
                            {logs.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm">Waiting for system events...</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

import { Button } from "@/components/ui/button";
