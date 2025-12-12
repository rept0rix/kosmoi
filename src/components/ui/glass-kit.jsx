
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * GlassCard - A card with glassmorphism effect
 */
export const GlassCard = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative overflow-hidden rounded-xl border border-white/20 bg-white/30 backdrop-blur-xl shadow-lg dark:bg-black/30 dark:border-white/10",
            className
        )}
        {...props}
    >
        {/* Shine effect overlay (optional, subtle) */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none opacity-50 dark:from-white/10" />
        {children}
    </div>
));
GlassCard.displayName = "GlassCard";

/**
 * GlassButton - A button with glass effect
 */
export const GlassButton = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    // We wrap the standard Button but override styles
    return (
        <Button
            ref={ref}
            variant="ghost" // Base style
            className={cn(
                "bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 text-foreground transition-all duration-300 shadow-sm hover:shadow-md",
                "dark:bg-black/20 dark:border-white/10 dark:hover:bg-white/10 dark:text-white",
                className
            )}
            {...props}
        />
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
            "rounded-lg bg-white/20 backdrop-blur-md border border-white/10 p-4 shadow-sm dark:bg-black/20 dark:border-white/5",
            className
        )}
        {...props}
    >
        {children}
    </div>
));
GlassPanel.displayName = "GlassPanel";
