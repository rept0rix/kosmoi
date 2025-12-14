import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * GlassCard
 * A premium card component with glassmorphism effect.
 * Supports framer-motion props for entrance animations.
 */
/**
 * @typedef {Object} GlassCardProps
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {boolean} [hoverEffect]
 */

/**
 * @type {React.ForwardRefExoticComponent<GlassCardProps & React.RefAttributes<HTMLDivElement>>}
 */
const GlassCard = React.forwardRef(({ className, children, hoverEffect = false, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-glass",
                "dark:bg-black/20 dark:border-white/5",
                hoverEffect && "transition-all duration-300 hover:shadow-glass-hover hover:-translate-y-1 hover:bg-white/10 dark:hover:bg-white/5",
                className
            )}
            {...props}
        >
            {/* Mesh Gradient Blob for depth (Optional, minimal) */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl opacity-20" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
});

GlassCard.displayName = "GlassCard";

export { GlassCard };
