import React, { useState } from 'react';
import { agents, groupAgentsByLayer } from '../services/agents/AgentRegistry';
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentChatWindow } from '../components/agents/AgentChatWindow';
import { ApprovalQueue } from "@/components/agents/ApprovalQueue";
import { AgentService } from '../services/agents/AgentService';
import GroupChatWindow from '../components/agents/GroupChatWindow';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Users, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AgentCommandCenter() {
    const [selectedAgentId, setSelectedAgentId] = useState(null);
    const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'group'
    const { user } = useAuth();

    const agentGroups = groupAgentsByLayer();
    const selectedAgent = selectedAgentId ? agents.find(a => a.id === selectedAgentId) : null;

    // Create service instance for selected agent
    const agentService = React.useMemo(() => {
        if (!selectedAgent) return null;
        const service = new AgentService(selectedAgent, { userId: user?.id });
        service.init();
        return service;
    }, [selectedAgent, user]);

    // 🆕 New Agent Logic
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

    // Calculate total agents
    const totalAgents = agents.length;
    const newAgentsCount = agents.filter(a => !seenAgents.includes(a.id)).length;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 pb-24 relative overflow-hidden">
            {/* Background Gradients */}
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
                        <p className="text-slate-500 mt-1 font-mono text-sm tracking-wide flex items-center gap-2">
                            ORCHESTRATE YOUR AI WORKFORCE
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs ml-2">
                                {totalAgents} Agents
                            </span>
                            {newAgentsCount > 0 && (
                                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/30 animate-pulse">
                                    {newAgentsCount} New
                                </span>
                            )}
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
                    </div>
                </div>

                {/* 🛡️ SAFETY: Approval Queue */}
                <ApprovalQueue userId={user?.id} />

                {/* Content Area */}
                {viewMode === 'group' ? (
                    <GroupChatWindow userId={user?.id} />
                ) : (
                    /* Individual View Logic */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">

                        {/* Left Column: Agent Grid */}
                        <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                            {['board', 'strategic', 'executive', 'marketing', 'operational', 'interface', 'automation', 'documentation', 'growth'].map(layer => {
                                const layerAgents = agentGroups[layer];
                                if (!layerAgents || layerAgents.length === 0) return null;

                                return (
                                    <div key={layer} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                {layer.replace('-', ' ')} Layer
                                                <span className="text-slate-600 bg-slate-900/50 px-1.5 rounded ml-1 text-xs">
                                                    {layerAgents.length}
                                                </span>
                                            </h2>
                                            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {layerAgents.map(agent => (
                                                <div key={agent.id}>
                                                    <AgentCard
                                                        agent={{ ...agent, isNew: !seenAgents.includes(agent.id) }}
                                                        isActive={selectedAgentId === agent.id}
                                                        onSelect={handleSelectAgent}
                                                    />
                                                </div>
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
                                        onForward={() => { }} // Placeholder for now
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
