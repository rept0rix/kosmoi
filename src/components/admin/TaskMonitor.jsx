import React, { useEffect, useState } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle, Clock, AlertCircle, Terminal, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function TaskMonitor() {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ pending: 0, in_progress: 0, done: 0, failed: 0 });

    useEffect(() => {
        fetchInitialTasks();

        // Subscribe to real-time changes
        const subscription = realSupabase
            .channel('public:agent_tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, handleRealtimeUpdate)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchInitialTasks = async () => {
        const { data, error } = await realSupabase
            .from('agent_tasks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setTasks(data);
            updateStats(data);
        }
    };

    const handleRealtimeUpdate = (payload) => {
        setTasks(currentTasks => {
            let newTasks = [...currentTasks];

            if (payload.eventType === 'INSERT') {
                newTasks.unshift(payload.new);
            } else if (payload.eventType === 'UPDATE') {
                newTasks = newTasks.map(task =>
                    task.id === payload.new.id ? payload.new : task
                );
            } else if (payload.eventType === 'DELETE') {
                newTasks = newTasks.filter(task => task.id !== payload.old.id);
            }

            // Keep only last 50
            if (newTasks.length > 50) newTasks = newTasks.slice(0, 50);

            updateStats(newTasks);
            return newTasks;
        });
    };

    const updateStats = (currentTasks) => {
        const newStats = { pending: 0, in_progress: 0, done: 0, failed: 0 };
        currentTasks.forEach(task => {
            if (newStats[task.status] !== undefined) {
                newStats[task.status]++;
            }
        });
        setStats(newStats);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse';
            case 'done': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'in_progress': return <Activity className="w-4 h-4 animate-spin" />;
            case 'done': return <CheckCircle className="w-4 h-4" />;
            case 'failed': return <AlertCircle className="w-4 h-4" />;
            default: return <Terminal className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Stats Header */}
            <div className="grid grid-cols-4 gap-4">
                <StatBox label="Pending" value={stats.pending} color="text-yellow-400" icon={<Clock className="w-5 h-5" />} />
                <StatBox label="Active" value={stats.in_progress} color="text-blue-400" icon={<Activity className="w-5 h-5" />} />
                <StatBox label="Completed" value={stats.done} color="text-green-400" icon={<CheckCircle className="w-5 h-5" />} />
                <StatBox label="Failed" value={stats.failed} color="text-red-400" icon={<AlertCircle className="w-5 h-5" />} />
            </div>

            {/* Task Board */}
            <div className="flex-1 bg-slate-900/50 rounded-xl border border-white/10 backdrop-blur-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/80">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-purple-400" />
                        Live Task Feed
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live Connection
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column: Pending */}
                    <TaskColumn title="Queued" icon={<Clock className="w-4 h-4" />} color="border-yellow-500/30">
                        {tasks.filter(t => t.status === 'pending' || t.status === 'open').map(task => (
                            <TaskCard key={task.id} task={task} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} />
                        ))}
                    </TaskColumn>

                    {/* Column: In Progress */}
                    <TaskColumn title="Running" icon={<Activity className="w-4 h-4" />} color="border-blue-500/30">
                        {tasks.filter(t => t.status === 'in_progress').map(task => (
                            <TaskCard key={task.id} task={task} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} />
                        ))}
                    </TaskColumn>

                    {/* Column: Recent History (Done/Failed) */}
                    <TaskColumn title="Recent History" icon={<CheckCircle className="w-4 h-4" />} color="border-slate-500/30">
                        {tasks.filter(t => ['done', 'failed', 'completed'].includes(t.status)).slice(0, 10).map(task => (
                            <TaskCard key={task.id} task={task} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} />
                        ))}
                    </TaskColumn>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, color, icon }) {
    return (
        <Card className="bg-slate-900/40 border-white/5">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-white/5 ${color}`}>{icon}</div>
            </CardContent>
        </Card>
    );
}

function TaskColumn({ title, icon, children, color }) {
    return (
        <div className={`flex flex-col h-full bg-slate-950/30 rounded-lg border ${color}`}>
            <div className="p-3 border-b border-white/5 font-medium text-slate-300 flex items-center gap-2 text-sm bg-slate-900/50">
                {icon} {title} ({React.Children.count(children)})
            </div>
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-2 pr-2">
                    {children}
                </div>
            </ScrollArea>
        </div>
    );
}

function TaskCard({ task, getStatusColor, getStatusIcon }) {
    return (
        <div className={`p-3 rounded-lg border bg-slate-900/80 transition-all hover:bg-slate-800 ${getStatusColor(task.status)}`}>
            <div className="flex justify-between items-start mb-1">
                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 bg-transparent border-current opacity-70`}>
                    {task.priority || 'NORMAL'}
                </Badge>
                <span className="text-[10px] text-slate-500 font-mono">
                    {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </span>
            </div>
            <h4 className="font-medium text-sm text-slate-200 line-clamp-1 mb-1" title={task.title}>
                {task.title}
            </h4>
            <div className="flex justify-between items-end mt-2">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Cpu className="w-3 h-3" />
                    {task.assigned_to ?
                        <span className="text-blue-300">{task.assigned_to} Agent</span> :
                        <span className="text-slate-600">Unassigned</span>
                    }
                </div>
            </div>
        </div>
    );
}
