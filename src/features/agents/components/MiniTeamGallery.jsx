import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MiniTeamGallery = ({ agents, activeAgentIds }) => {
    const activeAgents = agents.filter(a => activeAgentIds.includes(a.id));

    return (
        <div className="flex items-center gap-2 p-2 overflow-x-auto no-scrollbar border-t bg-gray-50/50">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">
                Active Matrix
            </span>
            {activeAgents.map(agent => (
                <TooltipProvider key={agent.id}>
                    <Tooltip>
                        <TooltipTrigger>
                            <div className={`relative group w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm transition-all hover:scale-110 hover:shadow-md hover:border-${agent.color}-200`}>
                                <div className={`w-full h-full rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-${agent.color}-600 bg-${agent.color}-50`}>
                                    {agent.avatar ?
                                        <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                                        : (agent.name || '?').charAt(0)
                                    }
                                </div>
                                {/* Status Dot */}
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white"></span>
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex flex-col">
                                <span className="font-bold">{agent.name}</span>
                                <span className="text-[10px] text-gray-400">{agent.role}</span>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    );
};

export default MiniTeamGallery;
