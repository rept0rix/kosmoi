import React from "react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} GlassCardProps
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {'default' | 'premium' | 'flat'} [variant]
 * @property {boolean} [hoverEffect]
 * @property {React.ElementType} [as]
 * @property {() => void} [onClick]
 * @property {React.CSSProperties} [style]
 * @property {React.ReactNode} [children]
 */

/**
 * GlassCard - Core component for Cyberpunk UI
 * @param {GlassCardProps} props
 */
export const GlassCard = ({
  children,
  className,
  variant = "default",
  hoverEffect = false,
  as: Component = "div",
  ...props
}) => {
  const variants = {
    default: "bg-slate-900/60 backdrop-blur-xl border border-white/5 shadow-xl",
    premium:
      "bg-slate-900/80 backdrop-blur-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-900/20 bg-gradient-to-br from-slate-900/90 to-slate-900/50",
    flat: "bg-slate-800/40 backdrop-blur-md border border-white/5",
  };

  const hoverStyles = hoverEffect
    ? "transition-all duration-300 hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:-translate-y-1"
    : "";

  return (
    <Component
      className={cn(
        "rounded-2xl relative overflow-hidden",
        variants[variant],
        hoverStyles,
        className,
      )}
      {...props}
    >
      {/* Subtle Noise Texture Overlay (Optional) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
};
