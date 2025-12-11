import React from 'react';
import { motion } from 'framer-motion';

const UXHeatmapOverlay = ({ points, isScanning }) => {
    if ((!points || points.length === 0) && !isScanning) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Scanning Effect */}
            {isScanning && (
                <motion.div
                    className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.div
                        className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                        initial={{ top: "-10%" }}
                        animate={{ top: "110%" }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                    />
                </motion.div>
            )}

            {/* Heatmap Points */}
            {points?.map((point, index) => (
                <motion.div
                    key={`${index}-${point.x}-${point.y}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ delay: index * 0.05, duration: 0.5, type: "spring" }}
                    className="absolute rounded-full blur-2xl mixture-blend-overlay"
                    style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        width: `${point.intensity * 3}px`,
                        height: `${point.intensity * 3}px`,
                        backgroundColor: getHeatColor(point.score),
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
        </div>
    );
};

const getHeatColor = (score) => {
    // Score 0-100
    if (score >= 90) return 'rgba(255, 0, 0, 0.9)'; // Red Hot
    if (score >= 70) return 'rgba(255, 100, 0, 0.8)'; // Orange
    if (score >= 50) return 'rgba(255, 255, 0, 0.7)'; // Yellow
    if (score >= 30) return 'rgba(0, 255, 0, 0.6)'; // Green
    return 'rgba(0, 0, 255, 0.5)'; // Blue (Cold)
};

export default UXHeatmapOverlay;
