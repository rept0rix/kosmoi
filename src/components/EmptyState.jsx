
import React from 'react';
import { cn } from "@/shared/lib/utils";
import { GlassCard } from "@/components/ui/glass-kit";
import { SearchX, FolderOpen, BellOff, Ghost } from "lucide-react";

const icons = {
    search: SearchX,
    folder: FolderOpen,
    notification: BellOff,
    ghost: Ghost
};

export default function EmptyState({
    title = "No results found",
    description = "We couldn't find what you were looking for.",
    icon = "search",
    action = null,
    className
}) {
    const Icon = icons[icon] || icons.search;

    return (
        <GlassCard className={cn("flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-white/10", className)}>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-6 relative">
                <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                {description}
            </p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </GlassCard>
    );
}
