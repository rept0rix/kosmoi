import React, { useState } from 'react';
import { agents, groupAgentsByLayer } from '@/features/agents/services/AgentRegistry';
import { AgentCard } from '@/features/agents/components/AgentCard';
import { AgentChatWindow } from '@/features/agents/components/AgentChatWindow';
import { ApprovalQueue } from "@/features/agents/components/ApprovalQueue";
import { AgentService } from '@/features/agents/services/AgentService';
import GroupChatWindow from '@/features/agents/components/GroupChatWindow';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAgentLiveStatus } from '@/features/agents/hooks/useAgentLiveStatus';
import { LayoutDashboard, Users, Cpu, Activity, Wifi, WifiOff, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskMonitor } from '@/components/admin/TaskMonitor';
import { AutonomyDashboard } from '@/components/admin/AutonomyDashboard';

export default function AgentCommandCenter() {
    const [selectedAgentId, setSelectedAgentId] = useState(null);
    const [viewMode, setViewMode] = useState('individual');
    const { user } = useAuth();

    const agentGroups = groupAgentsByLayer();
    const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

    // Live status from Supabase real-time
    const { statusMap, workerAlive } = useAgentLiveStatus();

    // Count how many agents are running right now
    const runningCount = Object.values(statusMap).filter(s => s.status === 'in_progress').length;

    const agentService = React.useMemo(() => {
        if (!selectedAgent) return null;
        const service = new AgentService(selectedAgent, { userId: user?.id });
        service.init();
        return service;
    }, [selectedAgent, user]);

    const [seenAgents, setSeenAgents] = useState(() => {
        const stored = localStorage.getItem('seen_agents');
        return stored ? JSON.parse(stored) : [];
    });

    const handleSelectAgent = (agent) => {
        setSelectedAgentId(agent.id);
        if (!seenAgents.includes(agent.id)) {
            const newSeen = [...seenAgents, agent.id];
            setSeenAgents(newSeen);
            localStorage.setItem('seen_agents', JSON.stringify(newSeen));
        }
    };

    const totalAgents = agents.length;
    const newAgentsCount = agents.filter(a => !seenAgents.includes(a.id)).length;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 pb-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-900/10 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10 p-6">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-blue-500" />
                            Command Center
                        </h1>
                        <p className="text-slate-500 mt-1 font-mono text-sm tracking-wide flex items-center gap-2 flex-wrap">
                            ORCHESTRATE YOUR AI WORKFORCE
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs ml-2">
                                {totalAgents} Agents
                            </span>
                            {runningCount > 0 && (
                                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/30 animate-pulse">
                                    ● {runningCount} Running
                                </span>
                            )}
                            {newAgentsCount > 0 && (
                                <span className="bg-neon-pink/10 text-pink-400 px-2 py-0.5 rounded text-xs border border-pink-500/30">
                                    {newAgentsCount} New
                                </span>
                            )}
                            {/* Worker heartbeat */}
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${
                                workerAlive === true
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                    : workerAlive === false
                                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                        : 'bg-slate-800 text-slate-500 border-white/5'
                            }`}>
                                {workerAlive === true ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {workerAlive === true ? 'Worker Online' : workerAlive === false ? 'Worker Offline' : 'Worker Unknown'}
                            </span>
                        </p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10 shadow-lg backdrop-blur-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setViewMode('individual'); setSelectedAgentId(null); }}
                            className={`gap-2 ${viewMode === 'individual' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Individual
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setViewMode('group'); setSelectedAgentId(null); }}
                            className={`gap-2 ${viewMode === 'group' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users className="w-4 h-4" />
                            Board Meeting
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setViewMode('operations'); setSelectedAgentId(null); }}
                            className={`gap-2 ${viewMode === 'operations' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Activity className="w-4 h-4" />
                            Operations
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setViewMode('autonomy'); setSelectedAgentId(null); }}
                            className={`gap-2 ${viewMode === 'autonomy' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Brain className="w-4 h-4" />
                            Autonomy
                        </Button>
                    </div>
                </div>

                {/* Approval Queue */}
                <ApprovalQueue userId={user?.id} />

                {/* Content Area */}
                {viewMode === 'autonomy' ? (
                    <div className="h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                        <AutonomyDashboard />
                    </div>
                ) : viewMode === 'operations' ? (
                    <div className="h-[calc(100vh-200px)]">
                        <TaskMonitor />
                    </div>
                ) : viewMode === 'group' ? (
                    <GroupChatWindow userId={user?.id} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">

                        {/* Left Column: Agent Grid */}
                        <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                            {['board', 'strategic', 'executive', 'marketing', 'operational', 'interface', 'automation', 'documentation', 'growth'].map(layer => {
                                const layerAgents = agentGroups[layer];
                                if (!layerAgents || layerAgents.length === 0) return null;

                                const layerRunning = layerAgents.filter(a => statusMap[a.id]?.status === 'in_progress').length;

                                return (
                                    <div key={layer} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${layerRunning > 0 ? 'bg-green-400 animate-pulse' : 'bg-blue-500'}`}></span>
                                                {layer.replace('-', ' ')} Layer
                                                <span className="text-slate-600 bg-slate-900/50 px-1.5 rounded ml-1 text-xs">
                                                    {layerAgents.length}
                                                </span>
                                                {layerRunning > 0 && (
                                                    <span className="text-green-400 text-xs font-mono">● {layerRunning} active</span>
                                                )}
                                            </h2>
                                            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {layerAgents.map(agent => (
                                                <AgentCard
                                                    key={agent.id}
                                                    agent={{ ...agent, isNew: !seenAgents.includes(agent.id) }}
                                                    isActive={selectedAgentId === agent.id}
                                                    onSelect={handleSelectAgent}
                                                    liveStatus={statusMap[agent.id] || null}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Column: Chat Interface */}
                        <div className="lg:col-span-1 h-full">
                            <div className="sticky top-6 h-full">
                                {selectedAgent && agentService ? (
                                    <AgentChatWindow
                                        agentConfig={selectedAgent}
                                        agentService={agentService}
                                        onForward={() => {}}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-2xl border border-slate-200/60 border-dashed">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                            <Cpu className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="font-medium">Select an agent to start command</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
