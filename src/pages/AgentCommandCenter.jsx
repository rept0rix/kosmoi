import React, { useState } from 'react';
import { agents, groupAgentsByLayer } from '../services/agents/AgentRegistry';
import { AgentCard } from '../components/agents/AgentCard';
import { AgentChatWindow } from '../components/agents/AgentChatWindow';
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

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
                        <p className="text-slate-500 mt-1">Orchestrate your AI workforce</p>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <Button
                            variant={viewMode === 'individual' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setViewMode('individual'); setSelectedAgentId(null); }}
                            className="gap-2"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Individual
                        </Button>
                        <Button
                            variant={viewMode === 'group' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setViewMode('group'); setSelectedAgentId(null); }}
                            className="gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Board Meeting
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                {viewMode === 'group' ? (
                    <GroupChatWindow userId={user?.id} />
                ) : (
                    /* Individual View Logic */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">

                        {/* Left Column: Agent Grid */}
                        <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-8">
                            {Object.entries(agentGroups).map(([layer, layerAgents]) => (
                                <div key={layer} className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                            {layer.replace('-', ' ')} Layer
                                        </h2>
                                        <div className="h-px flex-1 bg-slate-200"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {layerAgents.map(agent => (
                                            <div key={agent.id}>
                                                <AgentCard
                                                    agent={agent}
                                                    isActive={selectedAgentId === agent.id}
                                                    onSelect={(a) => setSelectedAgentId(a.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
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
