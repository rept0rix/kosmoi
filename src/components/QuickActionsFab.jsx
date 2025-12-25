import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Scan, ArrowUpRight, ArrowDownLeft, CreditCard, X, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

// "FM-11 Expanding Circle" Effect
// A FAB that expands into a circle of action buttons.

const actions = [
    { icon: Scan, label: "Scan", color: "bg-blue-500", url: "/wallet/scan" },
    { icon: ArrowUpRight, label: "Send", color: "bg-indigo-500", url: "/wallet/send" },
    { icon: ArrowDownLeft, label: "Receive", color: "bg-purple-500", url: "/wallet/receive" },
    { icon: CreditCard, label: "Card", color: "bg-pink-500", url: "/wallet/card" },
];

export default function QuickActionsFab() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    // Animation variants
    const containerVariants = {
        open: {
            transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        },
        closed: {
            transition: { staggerChildren: 0.05, staggerDirection: -1 }
        }
    };

    const itemVariants = {
        open: (index) => {
            // Symmetrical Arc: -135 to -45 degrees (Top-Left to Top-Right fan)
            // 90 degree spread centered upwards
            const startAngle = -135;
            const endAngle = -45;
            const totalSpread = endAngle - startAngle;
            // For N items, we want them distributed evenly. 
            // If 1 item -> -90
            // If > 1 -> start + index * (total / (N-1))
            const step = actions.length > 1 ? totalSpread / (actions.length - 1) : 0;

            const theta = (startAngle + index * step) * (Math.PI / 180);
            const radius = 85;

            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta);

            return {
                x,
                y,
                opacity: 1,
                scale: 1,
                transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }
            };
        },
        closed: {
            x: 0,
            y: 0,
            opacity: 0,
            scale: 0.5,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        }
    };

    return (
        <div className="relative flex items-center justify-center w-16 h-16">
            {/* Dimmed Background Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleOpen}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Actions Items Wrapper - Anchored to Center */}
            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <motion.div
                    variants={containerVariants}
                    initial="closed"
                    animate={isOpen ? "open" : "closed"}
                    className="relative w-0 h-0" // Zero size center point
                >
                    {actions.map((action, index) => (
                        <motion.div
                            key={action.label}
                            custom={index}
                            variants={itemVariants}
                            className="absolute -ml-6 -mt-6 pointer-events-auto" // Center the 48px button on the point
                        >
                            <Link to={action.url} className="relative group flex flex-col items-center justify-center">
                                <div className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all transform`}>
                                    <action.icon size={20} />
                                </div>
                                <span className="absolute -top-8 px-2 py-1 bg-white text-gray-800 text-xs rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {action.label}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Main FAB Toggle */}
            <div className="relative z-50">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleOpen}
                    className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white text-2xl transition-colors ${isOpen ? 'bg-slate-800' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'}`}
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isOpen ? <Plus size={32} strokeWidth={2.5} className="rotate-45" /> : <QrCode size={28} />}
                    </motion.div>
                </motion.button>
            </div>
        </div>
    );
}
