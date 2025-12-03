// src/components/agents/AgentCard.jsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AgentCard({ agent, isActive, onSelect }) {
    return (
        <Card
            onClick={() => onSelect(agent)}
            className={cn(
                "p-3 mb-2 cursor-pointer transition-all hover:shadow-md border-l-4",
                isActive
                    ? "border-l-blue-600 bg-blue-50/50 border-y-gray-200 border-r-gray-200"
                    : "border-l-transparent hover:border-l-gray-300"
            )}
        >
            <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm text-gray-900">{agent.role}</div>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 uppercase tracking-wider">
                    {agent.layer}
                </Badge>
            </div>

            <div className="text-xs text-gray-500 font-mono mb-2 opacity-70">
                {agent.id}
            </div>

            <div className="flex flex-wrap gap-1">
                {agent.allowedTools?.slice(0, 3).map(tool => (
                    <span key={tool} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {tool}
                    </span>
                ))}
                {(agent.allowedTools?.length || 0) > 3 && (
                    <span className="text-[10px] text-gray-400 px-1">+{(agent.allowedTools?.length || 0) - 3}</span>
                )}
            </div>
        </Card>
    );
}
