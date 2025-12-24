
import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export default function PageTransition({ children }) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
}
