import React from 'react';
import { motion } from 'framer-motion';

export const ShimmerButton = ({ children, className = "", onClick, ...props }) => {
    return (
        <button
            className={`relative overflow-hidden group ${className}`}
            onClick={onClick}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            <motion.div
                className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
        </button>
    );
};

// Add this to your tailwind.config.js if not present using arbitrary values instead for now
// animation: { shimmer: 'shimmer 2s linear infinite' }

export default ShimmerButton;
