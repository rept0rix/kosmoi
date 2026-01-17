
import React from 'react';
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * GlassCard - A card with glassmorphism effect
 * @param {object} props
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
/**
 * GlassCard - A premium card with deep blur and subtle reflections
 * @param {object} props
 */
export const GlassCard = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "glass-card grainy-noise p-6 shadow-2xl transition-all duration-500",
            "hover:shadow-banana-500/10 hover:border-white/20",
            className
        )}
        {...props}
    >
        {children}
    </div>
));
GlassCard.displayName = "GlassCard";

/**
 * GlassButton - A tactical button with neon glow and high-end feedback
 * @param {object} props
 */
export const GlassButton = React.forwardRef(({ className, variant = "default", children, ...props }, ref) => {
    return (
        <Button
            ref={ref}
            variant="ghost"
            className={cn(
                "relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 text-white",
                "hover:bg-white/10 hover:border-white/20 hover:text-white shadow-lg transition-all duration-300",
                "active:scale-95 group",
                className
            )}
            {...props}
        >
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-banana-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </Button>
    );
});
GlassButton.displayName = "GlassButton";

/**
 * GlassPanel - A simpler panel for sections
 */
export const GlassPanel = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "glass-panel rounded-2xl p-4 transition-colors duration-300",
            className
        )}
        {...props}
    >
        {children}
    </div>
));
GlassPanel.displayName = "GlassPanel";
