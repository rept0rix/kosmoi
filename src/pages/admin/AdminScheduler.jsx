import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Loader2, Bot, Calendar, CalendarCheck, RefreshCw,
    Clock, Play, CheckCircle, XCircle, Pause, Zap,
    Plus, Trash2, Search
} from "lucide-react";
import { supabase } from "../../api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import KosmoiLoader from "@/components/ui/KosmoiLoader";

const AdminScheduler = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [cronStatus, setCronStatus] = useState(null);
    const [triggering, setTriggering] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadTasks();
        checkCronStatus();

        // Realtime subscription
        const channel = supabase.channel('admin-scheduler-feed');
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'agent_tasks' },
            () => loadTasks()
        ).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('agent_tasks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
        setTasks(data || []);
        setLoading(false);
    };

    const checkCronStatus = async () => {
        try {
            const { data } = await supabase
                .from('agent_logs')
                .select('created_at, response')
                .eq('agent_id', 'core-loop-cron')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                const lastTick = new Date(data.created_at);
                const minutesAgo = Math.floor((Date.now() - lastTick.getTime()) / 60000);
                setCronStatus({
                    lastTick,
                    minutesAgo,
                    healthy: minutesAgo < 15,
                    result: data.response
                });
            }
        } catch {
            setCronStatus(null);
        }
    };

    const triggerCron = async () => {
        setTriggering(true);
        try {
            const res = await fetch('/api/cron/agent-tick', { method: 'POST' });
            const result = await res.json();
            toast({ title: 'Cron Triggered', description: `Action: ${result.action || 'unknown'}` });
            loadTasks();
            checkCronStatus();
        } catch (error) {
            toast({ title: 'Trigger Failed', description: error.message, variant: 'destructive' });
        } finally {
            setTriggering(false);
        }
    };

    const updateTaskStatus = async (id, newStatus) => {
        const { error } = await supabase
            .from('agent_tasks')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Updated', description: `Task → ${newStatus}` });
            loadTasks();
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            completed: 'bg-green-500/20 text-green-400 border-green-500/30',
            failed: 'bg-red-500/20 text-red-400 border-red-500/30',
            cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        return (
            <Badge className={styles[status] || styles.open}>
                {status?.replace('_', ' ')}
            </Badge>
        );
    };

    const getPriorityDot = (priority) => {
        const colors = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-slate-500' };
        return <div className={`w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />;
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.assigned_to || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || task.status === filter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: tasks.length,
        open: tasks.filter(t => t.status === 'open').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <KosmoiLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                        Task Scheduler
                    </h1>
                    <p className="text-slate-400">Agent task queue — autonomous cron pipeline</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Cron Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                        cronStatus?.healthy
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${cronStatus?.healthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {cronStatus
                            ? `Cron: ${cronStatus.minutesAgo}m ago`
                            : 'Cron: No data'}
                    </div>

                    <Button
                        onClick={triggerCron}
                        disabled={triggering}
                        variant="outline"
                        size="sm"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                    >
                        {triggering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                        Trigger Now
                    </Button>

                    <Button onClick={loadTasks} variant="outline" size="sm" className="border-white/10">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900/40 border-white/5">
                    <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Tasks</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </Card>
                <Card className="p-4 bg-blue-900/20 border-blue-500/10">
                    <div className="text-blue-400 text-xs uppercase font-bold tracking-wider mb-1">Open</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
                </Card>
                <Card className="p-4 bg-yellow-900/20 border-yellow-500/10">
                    <div className="text-yellow-400 text-xs uppercase font-bold tracking-wider mb-1">In Progress</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
                </Card>
                <Card className="p-4 bg-green-900/20 border-green-500/10">
                    <div className="text-green-400 text-xs uppercase font-bold tracking-wider mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search tasks or agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                    />
                </div>
                <div className="flex gap-1">
                    {['all', 'open', 'in_progress', 'completed', 'failed'].map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className={filter === f
                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        >
                            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tasks Table */}
            <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider bg-white/5">
                                <th className="p-4 font-medium">Priority</th>
                                <th className="p-4 font-medium">Task</th>
                                <th className="p-4 font-medium">Assigned To</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Workflow</th>
                                <th className="p-4 font-medium">Created</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTasks.map(task => (
                                <tr key={task.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {getPriorityDot(task.priority)}
                                            <span className="text-xs text-slate-500 capitalize">{task.priority || 'medium'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-200 max-w-xs truncate">{task.title}</div>
                                        {task.description && (
                                            <div className="text-xs text-slate-500 max-w-xs truncate mt-1">{task.description}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {task.assigned_to ? (
                                            <div className="flex items-center gap-2">
                                                <Bot className="w-4 h-4 text-cyan-400" />
                                                <span className="text-sm text-cyan-300">{task.assigned_to}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="p-4">{getStatusBadge(task.status)}</td>
                                    <td className="p-4">
                                        {task.workflow && (
                                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                                {task.workflow}
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 font-mono">
                                        {new Date(task.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-1 justify-end">
                                            {task.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-yellow-400 hover:bg-yellow-500/10"
                                                    onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                                >
                                                    <Play className="w-3 h-3 mr-1" /> Start
                                                </Button>
                                            )}
                                            {task.status === 'in_progress' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-green-400 hover:bg-green-500/10"
                                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Done
                                                </Button>
                                            )}
                                            {(task.status === 'open' || task.status === 'in_progress') && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-red-400 hover:bg-red-500/10"
                                                    onClick={() => updateTaskStatus(task.id, 'cancelled')}
                                                >
                                                    <XCircle className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredTasks.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-lg">No tasks found</p>
                                        <p className="text-sm text-slate-600 mt-1">Trigger the cron to generate tasks from company goals</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AdminScheduler;
