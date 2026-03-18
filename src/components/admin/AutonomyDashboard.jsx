import React, { useEffect, useState } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { Brain, HeartPulse, RefreshCw, ShieldCheck, Lightbulb, AlertTriangle } from 'lucide-react';

/**
 * AutonomyDashboard
 * Shows real-time status of the autonomous agent worker:
 * - Heartbeat / online status
 * - Self-healing (auto-recovered tasks)
 * - Reflection cycle (lessons learned)
 * - System prompt addendum derived from learnings
 */
export function AutonomyDashboard() {
    const [heartbeat, setHeartbeat] = useState(null);
    const [learnings, setLearnings] = useState([]);
    const [recoveredTasks, setRecoveredTasks] = useState([]);
    const [addendum, setAddendum] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAll();

        // Poll every 30 seconds for fresh data
        const interval = setInterval(fetchAll, 30_000);
        return () => clearInterval(interval);
    }, []);

    const fetchAll = async () => {
        const [hbRes, learnRes, configRes, tasksRes] = await Promise.all([
            realSupabase.from('company_knowledge').select('value, updated_at').eq('key', 'WORKER_HEARTBEAT').single(),
            realSupabase.from('company_knowledge').select('value, updated_at').eq('key', 'WORKER_LEARNINGS').single(),
            realSupabase.from('company_knowledge').select('value').eq('key', 'WORKER_CONFIG').single(),
            realSupabase.from('agent_tasks')
                .select('id, title, assigned_to, updated_at')
                .like('result', '%Auto-recovered%')
                .order('updated_at', { ascending: false })
                .limit(10),
        ]);

        if (hbRes.data) setHeartbeat(hbRes.data);
        if (learnRes.data?.value?.lessons) setLearnings(learnRes.data.value.lessons);
        if (configRes.data?.value?.systemPromptAddendum) setAddendum(configRes.data.value.systemPromptAddendum);
        if (tasksRes.data) setRecoveredTasks(tasksRes.data);

        setLoading(false);
    };

    // Determine worker online status from heartbeat timestamp
    const isOnline = heartbeat ? (Date.now() - new Date(heartbeat.updated_at).getTime()) < 5 * 60 * 1000 : false;
    const lastSeen = heartbeat ? formatDistanceToNow(new Date(heartbeat.updated_at), { addSuffix: true }) : 'Never';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading autonomy data…
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Brain className="w-7 h-7 text-purple-400" />
                <div>
                    <h2 className="text-xl font-bold text-white">Autonomy Dashboard</h2>
                    <p className="text-xs text-slate-500 font-mono">Self-healing · Self-tasking · Self-improving</p>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Worker Online Status */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-500'}`} />
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase">Worker Status</p>
                        <p className={`text-lg font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Last heartbeat {lastSeen}</p>
                    </div>
                </div>

                {/* Lessons Learned */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase">Lessons Learned</p>
                        <p className="text-2xl font-bold text-yellow-300">{learnings.length}</p>
                        <p className="text-xs text-slate-500 mt-1">Stored in WORKER_LEARNINGS</p>
                    </div>
                </div>

                {/* Auto-Recovered Tasks */}
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-slate-400 font-mono uppercase">Auto-Recovered</p>
                        <p className="text-2xl font-bold text-blue-300">{recoveredTasks.length}</p>
                        <p className="text-xs text-slate-500 mt-1">Tasks rescued from stuck state</p>
                    </div>
                </div>
            </div>

            {/* System Prompt Addendum */}
            {addendum && (
                <div className="bg-purple-950/40 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <p className="text-sm font-semibold text-purple-300">Active System Prompt Addendum</p>
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Self-derived</span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{addendum}</p>
                </div>
            )}

            {/* Recent Lessons */}
            {learnings.length > 0 && (
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-sm font-semibold text-slate-200">Recent Lessons</h3>
                        <span className="text-xs text-slate-500">({learnings.length} total, showing last 5)</span>
                    </div>
                    <div className="space-y-2">
                        {learnings.slice(-5).reverse().map((lesson, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                                <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono flex-shrink-0 ${
                                    lesson.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                    lesson.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-slate-700 text-slate-400'
                                }`}>
                                    {lesson.priority || 'low'}
                                </span>
                                <div>
                                    <p className="text-slate-200">{lesson.lesson}</p>
                                    {lesson.applies_to && (
                                        <p className="text-slate-500 mt-0.5">Applies to: {lesson.applies_to}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Auto-Recovered Tasks */}
            {recoveredTasks.length > 0 && (
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <HeartPulse className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-semibold text-slate-200">Auto-Recovered Tasks</h3>
                    </div>
                    <div className="space-y-2">
                        {recoveredTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between text-xs bg-slate-800/50 rounded-lg px-3 py-2">
                                <div>
                                    <p className="text-slate-200 font-medium">{task.title}</p>
                                    <p className="text-slate-500">{task.assigned_to || 'unassigned'}</p>
                                </div>
                                <span className="text-slate-500 flex-shrink-0 ml-4">
                                    {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {learnings.length === 0 && recoveredTasks.length === 0 && !addendum && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-600 gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    <p className="text-sm">No autonomy data yet. Worker may not have run a reflection cycle.</p>
                </div>
            )}
        </div>
    );
}
