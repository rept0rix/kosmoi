import React from 'react';
import { motion } from 'framer-motion';

const KosmoiLoader = ({ className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
            <motion.div
                className="relative w-24 h-24 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Pulsing Glow Effect */}
                <motion.div
                    className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Rotating Ring */}
                <motion.div
                    className="absolute inset-0 border-2 border-transparent border-t-blue-400 border-l-purple-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Logo Image */}
                <motion.img
                    src="/kosmoi_logo_white.svg"
                    alt="Kosmoi"
                    className="w-12 h-12 object-contain relative z-10"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/kosmoi-logo.png";
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>

            <motion.p
                className="text-sm text-slate-400 font-medium tracking-wide"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                Loading Kosmoi...
            </motion.p>
        </div>
    );
};

export default KosmoiLoader;
