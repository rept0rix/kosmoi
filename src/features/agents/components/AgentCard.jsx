// src/components/agents/AgentCard.jsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { User, Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";

/**
 * @param {{ agent: object, isActive: boolean, onSelect: function, liveStatus: { status: string, currentTask: object, lastTask: object } }} props
 */
export function AgentCard({ agent, isActive, onSelect, liveStatus }) {
  const isRunning = liveStatus?.status === 'in_progress';
  const lastTask = liveStatus?.lastTask;
  const lastFailed = lastTask?.status === 'failed';

  return (
    <GlassCard
      onClick={() => onSelect(agent)}
      variant={isActive ? "premium" : "default"}
      className={cn(
        "group relative p-4 cursor-pointer overflow-hidden transition-all duration-300",
        isActive
          ? "border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.15)] ring-1 ring-neon-blue/30 scale-105 z-10"
          : isRunning
            ? "border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            : "hover:border-neon-blue/30 hover:shadow-neon-glow hover:-translate-y-1",
      )}
    >
      {/* Running pulse background */}
      {isRunning && (
        <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none" />
      )}
      {isActive && (
        <div className="absolute inset-0 bg-neon-blue/5 animate-pulse-slow pointer-events-none" />
      )}

      <div className="relative flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-md shadow-inner",
              isRunning
                ? "bg-green-500/20 text-green-400"
                : isActive
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
                isRunning ? "text-green-400" : isActive ? "text-neon-cyan drop-shadow-neon" : "text-slate-200",
              )}
            >
              {agent.role}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              ID: {agent.id?.substring(0, 8)}
            </div>
          </div>
        </div>

        {/* Status badge */}
        {isRunning ? (
          <Badge className="bg-green-500/10 text-green-400 border border-green-500/40 text-[10px] px-2 py-0.5 animate-pulse">
            ● RUNNING
          </Badge>
        ) : agent.isNew ? (
          <Badge className="bg-neon-pink/10 text-neon-pink border border-neon-pink/50 text-[10px] px-2 py-0.5 animate-pulse">
            NEW
          </Badge>
        ) : null}
      </div>

      {/* Last task result preview */}
      {lastTask && !isRunning && (
        <div className={cn(
          "mt-2 px-2 py-1.5 rounded text-[10px] border line-clamp-1",
          lastFailed
            ? "bg-red-500/10 border-red-500/20 text-red-300"
            : "bg-slate-800/50 border-white/5 text-slate-400"
        )}>
          {lastFailed ? <AlertCircle className="w-3 h-3 inline mr-1" /> : <CheckCircle className="w-3 h-3 inline mr-1 text-green-400" />}
          {lastTask.title}
        </div>
      )}

      {/* Current task name if running */}
      {isRunning && liveStatus.currentTask && (
        <div className="mt-2 px-2 py-1.5 rounded text-[10px] border bg-green-500/10 border-green-500/20 text-green-300 line-clamp-1">
          <Activity className="w-3 h-3 inline mr-1 animate-spin" />
          {liveStatus.currentTask.title}
        </div>
      )}

      {/* Tools */}
      <div className="relative flex flex-wrap gap-1.5 mt-3">
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

      {/* Bottom status dot */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <span className={cn(
          "w-2 h-2 rounded-full",
          isRunning ? "bg-green-400 animate-pulse" : lastFailed ? "bg-red-400" : "bg-slate-600"
        )} />
        <span className={cn(
          "text-[9px] font-mono",
          isRunning ? "text-green-400" : lastFailed ? "text-red-400" : "text-slate-600"
        )}>
          {isRunning ? "RUNNING" : lastFailed ? "FAILED" : "IDLE"}
        </span>
      </div>
    </GlassCard>
  );
}
