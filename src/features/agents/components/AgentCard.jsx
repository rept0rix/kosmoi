// src/components/agents/AgentCard.jsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";

export function AgentCard({ agent, isActive, onSelect }) {
    return (
        <Card
            onClick={() => onSelect(agent)}
            className={cn(
                "group relative p-4 cursor-pointer transition-all duration-300 border backdrop-blur-sm overflow-hidden",
                isActive
                    ? "bg-blue-600/20 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    : "bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-800/60 hover:-translate-y-1 hover:shadow-xl"
            )}
        >
            {/* Ambient Glow */}
            <div className={cn(
                "absolute -inset-2 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-purple-500/0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl",
                isActive && "opacity-30 from-blue-500/20 via-cyan-500/20 to-blue-500/20"
            )} />

            <div className="relative flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isActive ? "bg-blue-400 animate-pulse" : "bg-slate-600"
                    )} />
                    <div className={cn(
                        "font-bold text-sm tracking-wide",
                        isActive ? "text-white" : "text-slate-200"
                    )}>
                        {agent.role}
                    </div>
                </div>
                {agent.isNew && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-[10px] px-2 py-0.5 h-auto animate-pulse text-white border-0 shadow-lg shadow-green-500/20">
                        NEW
                    </Badge>
                )}
            </div>

            <div className="relative text-xs text-slate-500 font-mono mb-3 opacity-60 truncate">
                ID: {agent.id}
            </div>

            <div className="relative flex flex-wrap gap-1.5">
                {agent.allowedTools?.slice(0, 3).map(tool => (
                    <span key={tool} className="text-[10px] bg-white/5 border border-white/5 text-slate-400 px-2 py-1 rounded-md group-hover:bg-white/10 transition-colors">
                        {tool}
                    </span>
                ))}
                {(agent.allowedTools?.length || 0) > 3 && (
                    <span className="text-[10px] text-slate-500 px-1 self-center">+{(agent.allowedTools?.length || 0) - 3}</span>
                )}
            </div>
        </Card>
    );
}
