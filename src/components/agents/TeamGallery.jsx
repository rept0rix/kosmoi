import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Users, Zap, Shield, Briefcase, Code, Search, PenTool } from 'lucide-react';

const TeamGallery = ({ agents, activeAgentIds }) => {
    // 1. Resolve Active Agents
    const activeAgents = agents.filter(a => activeAgentIds.includes(a.id));

    // 2. Define Human User
    const humanUser = {
        id: 'HUMAN_USER',
        role: 'Naor Yanko',
        title: 'CEO / Human',
        layer: 'executive',
        isHuman: true
    };

    // 3. Combine for Display
    const team = [humanUser, ...activeAgents];

    const getAgentIcon = (role) => {
        const r = role.toLowerCase();
        if (r.includes('tech') || r.includes('lead')) return <Code className="w-6 h-6" />;
        if (r.includes('product') || r.includes('manager')) return <Briefcase className="w-6 h-6" />;
        if (r.includes('marketing') || r.includes('growth')) return <Zap className="w-6 h-6" />;
        if (r.includes('research')) return <Search className="w-6 h-6" />;
        if (r.includes('content') || r.includes('copy')) return <PenTool className="w-6 h-6" />;
        if (r.includes('ceo')) return <Shield className="w-6 h-6" />;
        return <Bot className="w-6 h-6" />;
    };

    const getAgentColor = (layer, isHuman) => {
        if (isHuman) return 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-200';
        switch (layer) {
            case 'board': return 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-slate-200';
            case 'strategic': return 'bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white shadow-purple-200';
            case 'executive': return 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-200';
            case 'operational': return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="w-full bg-white/50 backdrop-blur-sm border-t border-slate-100 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Active Team
                </h3>
                <Badge variant="secondary" className="text-[10px] h-5">{team.length}</Badge>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {team.map((member) => (
                    <Card
                        key={member.id}
                        className={`
                            relative overflow-hidden group transition-all duration-300 hover:shadow-md border-0 ring-1 ring-slate-200
                            flex flex-col items-center justify-center p-4 gap-3
                        `}
                    >
                        {/* Avatar Circle */}
                        <div className={`
                            w-14 h-14 rounded-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300
                            flex items-center justify-center shadow-lg ${getAgentColor(member.layer, member.isHuman)}
                        `}>
                            {member.isHuman ? <User className="w-7 h-7" /> : getAgentIcon(member.role)}
                        </div>

                        {/* Status Indicator (Purely visual active state) */}
                        <div className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>

                        {/* Info */}
                        <div className="text-center w-full">
                            <h4 className="text-xs font-bold text-slate-700 truncate leading-tight mb-0.5">
                                {member.role}
                            </h4>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide truncate">
                                {member.isHuman ? 'Human Leader' : member.layer}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TeamGallery;
