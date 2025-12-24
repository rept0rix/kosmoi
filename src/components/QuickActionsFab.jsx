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
            // Calculate position on a circle
            const angle = (index / (actions.length - 1)) * 180; // Spread over 180 degrees (top semi-circle) or just fanned out
            // Let's do a fan out effect upwards
            // Angle range: -150 to -30 degrees (from left to right upwards)
            // 4 items: -135, -105, -75, -45 degrees

            const startAngle = -150;
            const endAngle = -30;
            const step = (endAngle - startAngle) / (actions.length - 1);
            const theta = (startAngle + index * step) * (Math.PI / 180);
            const radius = 90; // distance from center

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

    const labelVariants = {
        open: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        closed: { opacity: 0, y: 10, transition: { duration: 0.2 } }
    };

    return (
        <div className="relative flex items-center justify-center">
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

            <div className="relative z-50">
                <motion.div
                    variants={containerVariants}
                    initial="closed"
                    animate={isOpen ? "open" : "closed"}
                    className="relative"
                >
                    {actions.map((action, index) => (
                        <motion.div
                            key={action.label}
                            custom={index}
                            variants={itemVariants}
                            className="absolute bottom-0 left-0 -ml-6 -mb-6" // Center the absolute items relative to the FAB center
                        >
                            <Link to={action.url} className="relative group flex flex-col items-center justify-center">
                                <div className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all`}>
                                    <action.icon size={20} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Extended Labels - Rendered separately to avoid rotation/transform issues if we used rotation */}
                {/* Actually, let's keep it simple. The icons verify the circular spread. Labels can be tooltips or simplified. */}

                {/* Main FAB Toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleOpen}
                    className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white text-2xl z-50 transition-colors ${isOpen ? 'bg-red-500' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'}`}
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
