
import React, { useState } from 'react';
import EvolutionTree from '@/components/admin/evolution/EvolutionTree';
import SchemaMap from '@/components/admin/evolution/SchemaMap';
import MemoryInspector from '@/components/admin/evolution/MemoryInspector';
import { cn } from '@/lib/utils';

export default function AdminEvolution() {
    const [activeTab, setActiveTab] = useState('tree');

    const tabs = [
        { id: 'tree', label: 'Evolution Tree', icon: '🌳' },
        { id: 'schema', label: 'Brain Structure (Schema)', icon: '🧠' },
        { id: 'memory', label: 'Subconscious (Memory)', icon: '🔮' },
    ];

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-950">
            {/* Tab Bar */}
            <div className="flex items-center justify-center gap-4 p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-20">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                            activeTab === tab.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        )}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {activeTab === 'tree' && <EvolutionTree />}
                {activeTab === 'schema' && <SchemaMap />}
                {activeTab === 'memory' && <MemoryInspector />}
            </div>
        </div>
    );
}
