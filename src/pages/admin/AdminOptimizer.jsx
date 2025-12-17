import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { BrainCircuit, Play, Pause, Zap, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext'; // Access to run ad-hoc tasks if needed
import { OptimizerLoop } from '@/services/loops/OptimizerLoop'; // We will control the loop directly

// Mock insights for initial render (until we hook up real data)
const MOCK_INSIGHTS = [
    { id: 1, type: 'optimization', title: 'Pricing Opportunity', description: 'Conversion rate is high (8%), suggesting demand elasticity. Recommend increasing "Standard Plan" price by 5%.', impact: 'High', status: 'pending', created_at: '2025-12-17T10:00:00Z' },
    { id: 2, type: 'fix', title: 'Agent Hallucination Fix', description: 'Detected repetitive loop in "Concierge Agent". Applied PROMPT_OVERRIDE_402 to strictly forbid JSON in chat.', impact: 'Medium', status: 'implemented', created_at: '2025-12-16T15:30:00Z' },
];

const AdminOptimizer = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [insights, setInsights] = useState(MOCK_INSIGHTS);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync with loop state on mount
    useEffect(() => {
        setIsRunning(OptimizerLoop.isRunning);
        // poll or subscribe to logs in V2
    }, []);

    const toggleLoop = () => {
        if (isRunning) {
            OptimizerLoop.stop();
            setIsRunning(false);
        } else {
            OptimizerLoop.start();
            setIsRunning(true);
        }
    };

    const runManually = async () => {
        setIsProcessing(true);
        try {
            await OptimizerLoop.runOptimizationCycle();
            // detailed fetch would go here
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-8 min-h-screen bg-[#020617] text-slate-200 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                        <BrainCircuit className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            Optimizer <span className="text-gradient-gold text-glow">Agent</span>
                        </h1>
                        <p className="text-slate-400 mt-1 max-w-xl">
                            Autonomous Meta-Learning & Business Optimization engine.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isRunning ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'} transition-all`}>
                        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_10px_currentColor]' : 'bg-slate-500'}`} />
                        <span className="text-sm font-semibold uppercase tracking-wider">{isRunning ? 'Active' : 'Standby'}</span>
                    </div>

                    <Button
                        onClick={toggleLoop}
                        variant={isRunning ? "destructive" : "default"}
                        className={isRunning ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50" : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20 shadow-lg"}
                    >
                        {isRunning ? <><Pause className="w-4 h-4 mr-2" /> Stop Loop</> : <><Play className="w-4 h-4 mr-2" /> Start Autonomous Mode</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Status & Manual Controls */}
                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Activity className="w-24 h-24 text-purple-500" />
                        </div>

                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" /> Quick Actions
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Force a specific analysis cycle right now. This will allow the agent to read the latest analytics and logs immediately.
                            </p>
                            <Button
                                onClick={runManually}
                                disabled={isProcessing}
                                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 h-12 text-lg"
                            >
                                {isProcessing ? <Activity className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                                {isProcessing ? 'Analyzing...' : 'Run Analysis Cycle Now'}
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-purple-400 mb-1">24</div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Optimizations</div>
                        </div>
                        <div className="glass-card p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-emerald-400 mb-1">98%</div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Health Score</div>
                        </div>
                    </div>
                </div>

                {/* Right: Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-emerald-400" /> Insights & Actions
                        </h3>
                        <Button variant="ghost" size="sm" className="text-slate-400">View History</Button>
                    </div>

                    <div className="space-y-4">
                        {insights.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 glass-card rounded-2xl border-dashed">
                                No insights generated yet. Run the agent to start analysis.
                            </div>
                        ) : (
                            insights.map((item) => (
                                <div key={item.id} className="glass-card p-5 rounded-xl border-l-4 border-l-purple-500 hover:bg-white/5 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'optimization' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        <Button size="sm" variant="secondary" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            Detail
                                        </Button>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-200 mb-1">{item.title}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.description}</p>

                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <Activity className="w-3 h-3 text-emerald-400" /> Impact: <span className="font-medium text-white">{item.impact}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            <AlertCircle className="w-3 h-3 text-blue-400" /> Status: <span className="font-medium capitalize text-white">{item.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOptimizer;
