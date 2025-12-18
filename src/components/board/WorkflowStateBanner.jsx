import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';

export default function WorkflowStateBanner({ state }) {
    if (!state) return null;

    const { workflow, currentStep, stepIndex } = state;
    const totalSteps = workflow.steps.length;
    const progress = ((stepIndex + 1) / totalSteps) * 100;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-blue-50/50 border-b border-blue-100 backdrop-blur-sm sticky top-14 z-20 overflow-hidden"
            >
                <div className="w-full h-1 bg-blue-100">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="px-6 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-full animate-pulse">
                            <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <span className="font-semibold text-blue-900">{workflow.name}</span>
                            <span className="mx-2 text-blue-300">|</span>
                            <span className="text-blue-700">Step {stepIndex + 1}: {currentStep.id}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep.role === 'user' ? (
                            <span className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-medium border border-orange-100">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Waiting for User Input
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {currentStep.role} is working...
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
