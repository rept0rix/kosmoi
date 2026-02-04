
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function GlobalChatFab() {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show on Chat pages to avoid redundancy, or on the Quick Access Pay menu
    // Also don't show on Admin pages if not desired, but "All Pages" usually implies consumer facing.
    // Let's hide on /admin just in case, or keep it. User said "all pages".
    // We definitely hide on /chat-hub and /chat/ routes.
    if (location.pathname.includes('/chat') || location.pathname.includes('/conversation') || location.pathname.includes('/planner')) {
        return null;
    }

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40" // Above the bottom nav (which is ~60-80px) on mobile
        >
            <Button
                onClick={() => navigate('/chat-hub')}
                className="rounded-full w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center p-0"
            >
                <MessageCircle className="w-7 h-7" />
                <span className="sr-only">Open Chat</span>
            </Button>
        </motion.div>
    );
}
