import React from 'react';
import { useAppConfig } from './AppConfigContext';
import { Bug, User, Briefcase, Shield, X } from 'lucide-react';

const DebugRoleSwitcher = () => {
    const { config, updateConfig } = useAppConfig();
    const role = config.debugRole || 'user';
    const [isCollapsed, setIsCollapsed] = React.useState(true); // Default to collapsed

    const roles = [
        { id: 'user', label: 'User', icon: User, color: 'bg-blue-500' },
        { id: 'business', label: 'Business', icon: Briefcase, color: 'bg-orange-500' },
        { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-600' }
    ];

    if (!import.meta.env.DEV) return null;

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="fixed bottom-4 right-4 z-[9999] bg-slate-900/90 text-white p-2 rounded-full shadow-xl border border-slate-700 hover:scale-110 transition-transform"
                title="Open Debug Role Switcher"
            >
                <Bug className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-slate-900/90 backdrop-blur text-white p-2 rounded-lg shadow-xl border border-slate-700 relative">
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="absolute -top-2 -right-2 bg-slate-700 rounded-full p-1 text-slate-300 hover:text-white hover:bg-slate-600 border border-slate-600"
                >
                    <X className="w-3 h-3" />
                </button>

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
