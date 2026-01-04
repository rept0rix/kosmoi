/**
 * ChatFloatingButton Component
 *
 * Floating Action Button (FAB) to trigger mobile chat experience.
 * Features pulse animation and glassmorphism styling.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatFloatingButton({ onClick, className = '' }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.5
      }}
      className={`fixed bottom-6 right-6 z-50 ${className}`}
    >
      {/* Pulsing glow effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 blur-lg"
      />

      {/* Main button */}
      <Button
        onClick={onClick}
        size="lg"
        className="relative h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-neon border-2 border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="sr-only">Open chat</span>
      </Button>

      {/* Notification badge (optional - can be used for unread count) */}
      {/* Uncomment if you want to show unread messages count
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 border-2 border-white shadow-md flex items-center justify-center"
      >
        <span className="text-xs font-bold text-white">3</span>
      </motion.div>
      */}
    </motion.div>
  );
}
