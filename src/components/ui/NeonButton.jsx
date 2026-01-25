import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * NeonButton - Primary action button for Cyberpunk UI
 */
export const NeonButton = ({
  children,
  className = "",
  variant = "cyan",
  size = "default",
  isLoading = false,
  disabled = false,
  ...props
}) => {
  const variants = {
    cyan: "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    pink: "bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/20 hover:border-fuchsia-400 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]",
    ghost:
      "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button
      className={cn(
        "relative overflow-hidden border rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 group",
        variants[variant],
        sizes[size],
        (isLoading || disabled) &&
          "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}

      <span className="relative z-10 flex items-center gap-2">{children}</span>

      {/* Shine Effect on Hover (Only for non-ghost) */}
      {variant !== "ghost" && (
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
      )}
    </button>
  );
};
