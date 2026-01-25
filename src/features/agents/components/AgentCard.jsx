// src/components/agents/AgentCard.jsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { User, Activity, Zap } from "lucide-react";

export function AgentCard({ agent, isActive, onSelect }) {
  return (
    <GlassCard
      onClick={() => onSelect(agent)}
      variant={isActive ? "premium" : "default"}
      className={cn(
        "group relative p-4 cursor-pointer overflow-hidden transition-all duration-300",
        isActive
          ? "border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.15)] ring-1 ring-neon-blue/30 scale-105 z-10"
          : "hover:border-neon-blue/30 hover:shadow-neon-glow hover:-translate-y-1",
      )}
    >
      {/* Active pulsing gloackground */}
      {isActive && (
        <div className="absolute inset-0 bg-neon-blue/5 animate-pulse-slow pointer-events-none" />
      )}

      <div className="relative flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-md shadow-inner",
              isActive
                ? "bg-neon-blue/20 text-neon-cyan"
                : "bg-slate-800/50 text-slate-400",
            )}
          >
            {agent.icon || <User className="w-4 h-4" />}
          </div>

          <div>
            <div
              className={cn(
                "font-bold text-sm tracking-wider uppercase font-mono transition-colors",
                isActive ? "text-neon-cyan drop-shadow-neon" : "text-slate-200",
              )}
            >
              {agent.role}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1. h-1.5 rounded-full bg-slate-600 inline-block" />
              ID: {agent.id?.substring(0, 8)}
            </div>
          </div>
        </div>

        {agent.isNew && (
          <Badge className="bg-neon-pink/10 text-neon-pink border border-neon-pink/50 text-[10px] px-2 py-0.5 animate-pulse shadow-neon-pink/20">
            NEW
          </Badge>
        )}
      </div>

      {/* Tools / Capabilities */}
      <div className="relative flex flex-wrap gap-1.5 mt-4">
        {agent.allowedTools?.slice(0, 3).map((tool) => (
          <span
            key={tool}
            className={cn(
              "text-[10px] px-2 py-1 rounded bg-black/40 border border-white/5 text-slate-400 transition-colors",
              "group-hover:border-white/10 group-hover:text-slate-300",
            )}
          >
            {tool}
          </span>
        ))}
        {(agent.allowedTools?.length || 0) > 3 && (
          <span className="text-[10px] text-slate-500 px-1 self-center font-mono">
            +{(agent.allowedTools?.length || 0) - 3}
          </span>
        )}
      </div>

      {/* Status Indicator (Bottom Right) */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Activity className="w-3 h-3 text-neon-cyan" />
        <span className="text-[9px] text-neon-cyan font-mono">READY</span>
      </div>
    </GlassCard>
  );
}
