import React from 'react';
import { useAppConfig } from './AppConfigContext';
import { Bug, User, Briefcase, Shield } from 'lucide-react';

const DebugRoleSwitcher = () => {
    const { config, updateConfig } = useAppConfig();
    const role = config.debugRole || 'user';

    const roles = [
        { id: 'user', label: 'User', icon: User, color: 'bg-blue-500' },
        { id: 'business', label: 'Business', icon: Briefcase, color: 'bg-orange-500' },
        { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-600' }
    ];

    if (!import.meta.env.DEV) return null; // Only show in dev mode (or always if user wants) or maybe just hide if not needed

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            <div className="bg-slate-900/90 backdrop-blur text-white p-2 rounded-lg shadow-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 px-2 text-xs uppercase tracking-wider text-slate-400 font-bold">
                    <Bug className="w-3 h-3" /> Debug Role
                </div>
                <div className="flex gap-1">
                    {roles.map(r => (
                        <button
                            key={r.id}
                            onClick={() => updateConfig({ debugRole: r.id })}
                            className={`p-2 rounded-md transition-all flex flex-col items-center gap-1 w-16
                                ${role === r.id ? `${r.color} text-white shadow-lg scale-105` : 'hover:bg-slate-800 text-slate-400'}`}
                            title={`Switch to ${r.label} view`}
                        >
                            <r.icon className="w-4 h-4" />
                            <span className="text-[10px] font-medium">{r.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebugRoleSwitcher;
