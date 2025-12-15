
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Zap, Box, Layers, Search, Code, Globe, MessageSquare, MoreHorizontal } from 'lucide-react';

const icons = {
    agent_ceo: Bot,
    agent_dev: Code,
    agent_marketing: Globe,
    tool_market_watch: Search,
    tool_trend_spy: Zap,
    blueprint_startup: Layers,
    blueprint_content: Layers,
    trigger_webhook: Globe,
    trigger_schedule: Zap,
};

const StudioNode = ({ data, selected }) => {
    const Icon = icons[data.type] || Box;
    const isAgent = data.type.startsWith('agent');
    const isTool = data.type.startsWith('tool');
    const isBlueprint = data.type.startsWith('blueprint');

    let borderColor = 'border-slate-600';
    let glowColor = '';

    if (selected) {
        borderColor = 'border-white';
        glowColor = 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
    } else if (isAgent) {
        borderColor = 'border-amber-500/50';
        glowColor = 'shadow-[0_0_10px_rgba(245,158,11,0.1)]';
    } else if (isTool) {
        borderColor = 'border-green-500/50';
        glowColor = 'shadow-[0_0_10px_rgba(34,197,94,0.1)]';
    } else if (isBlueprint) {
        borderColor = 'border-indigo-500/50';
        glowColor = 'shadow-[0_0_10px_rgba(99,102,241,0.1)]';
    }

    return (
        <div className={`
            min-w-[180px] bg-slate-900/90 backdrop-blur-md 
            rounded-xl border-2 ${borderColor} ${glowColor}
            transition-all duration-300
        `}>
            {/* Inputs */}
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-3 !h-3" />

            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-white/5">
                <div className={`p-1.5 rounded-lg bg-white/5`}>
                    <Icon size={16} className="text-slate-200" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">{data.label}</div>
                    <div className="text-[10px] text-slate-400 truncate uppercase tracking-widest">{data.subLabel || 'Node'}</div>
                </div>
                <MoreHorizontal size={14} className="text-slate-500 hover:text-white cursor-pointer" />
            </div>

            {/* Body */}
            {data.status && (
                <div className="px-3 py-2 bg-black/20">
                    <div className="flex items-center gap-2 text-[10px]">
                        <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-slate-400 uppercase">{data.status}</span>
                    </div>
                </div>
            )}

            {/* Outputs */}
            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-3 !h-3" />
        </div>
    );
};

export default memo(StudioNode);
