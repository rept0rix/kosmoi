import React from "react";
import { cn } from "@/lib/utils";

/**
 * StatusBadge - For displaying live status, tags, or agent states.
 */
export const StatusBadge = ({
  children,
  status = "default", // success | error | warning | info | neutral
  pulse = false,
  className,
}) => {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    neutral: "bg-slate-800 text-slate-400 border-slate-700",
    default: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const pulseColors = {
    success: "bg-emerald-400",
    error: "bg-red-400",
    warning: "bg-amber-400",
    info: "bg-cyan-400",
    neutral: "bg-slate-400",
    default: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md",
        styles[status],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              pulseColors[status],
            )}
          ></span>
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              pulseColors[status],
            )}
          ></span>
        </span>
      )}
      {children}
    </span>
  );
};
