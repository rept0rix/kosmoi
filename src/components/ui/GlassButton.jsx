import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * GlassButton
 * A premium button with glass effect and gradient border.
 */
/**
 * @typedef {Object} GlassButtonProps
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {'default' | 'primary' | 'ghost' | 'outline'} [variant]
 * @property {'default' | 'sm' | 'lg' | 'icon'} [size]
 */

/**
 * @type {React.ForwardRefExoticComponent<GlassButtonProps & React.RefAttributes<HTMLButtonElement>>}
 */
const GlassButton = React.forwardRef(({ className, variant = "default", size = "default", children, ...props }, ref) => {

    const variants = {
        default: "bg-white/10 hover:bg-white/20 border-white/10 text-white shadow-lg shadow-black/5",
        primary: "bg-primary/80 hover:bg-primary/90 border-transparent text-primary-foreground shadow-neon",
        ghost: "bg-transparent hover:bg-white/5 border-transparent text-foreground/80 hover:text-foreground",
        outline: "bg-transparent border-white/20 hover:bg-white/5 text-foreground",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    };

    return (
        <motion.button
            ref={ref}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "inline-flex items-center justify-center rounded-lg border text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
});

GlassButton.displayName = "GlassButton";

export { GlassButton };
