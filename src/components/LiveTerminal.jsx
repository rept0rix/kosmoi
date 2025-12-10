
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Maximize2, Minimize2, Power, Wifi, Cpu } from 'lucide-react';
import { db } from '@/api/supabaseClient';

const LiveTerminal = ({ className }) => {
    const [logs, setLogs] = useState([
        { ts: new Date().toISOString(), type: 'info', msg: 'SYSTEM_INIT: Neural Interface Loaded.' },
        { ts: new Date().toISOString(), type: 'success', msg: 'CONNECTION_ESTABLISHED: Mainframe <-> Worker_1' },
    ]);
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Simulate "Listening" to the background worker (since we can't read the real terminal stream in browser)
    // In a real deployed app, this would subscribe to a Supabase "logs" table.
    useEffect(() => {
        const interval = setInterval(() => {
            const actions = [
                "Scanning sector 7G...",
                "Optimizing neural weights...",
                "Harvesting data node...",
                "Sanitizing input buffer...",
                "Re-calibrating agent sensors...",
                "Database sync: 34ms latency...",
                "Worker_1: Heartbeat ACK...",
                "Analysing user intent pattern..."
            ];

            // Randomly pick an action to simulate activity
            if (Math.random() > 0.6) {
                const action = actions[Math.floor(Math.random() * actions.length)];
                addLog('info', `WORKER_STREAM: ${action}`);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const addLog = (type, msg) => {
        setLogs(prev => [...prev.slice(-50), { ts: new Date().toISOString(), type, msg }]);
    };

    return (
        <div className={`bg-black border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 h-auto' : 'h-96'} ${className}`}>

            {/* Terminal Header */}
            <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-mono text-green-500 font-bold uppercase tracking-wider">
                        /var/log/kosmoi_neural_stream
                    </span>
                    <div className="flex gap-1.5 ml-4">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-green-500/70 font-mono">LIVE CONNECTED</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button className="text-slate-500 hover:text-red-400 transition-colors">
                        <Power className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="flex-1 bg-black p-4 overflow-y-auto font-mono text-xs md:text-sm leading-relaxed space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
            >
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 hover:bg-slate-900/50 px-2 rounded opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-slate-600 shrink-0 select-none">
                            {log.ts.split('T')[1].split('.')[0]}
                        </span>
                        <span className={`
                            ${log.type === 'error' ? 'text-red-400 font-bold' :
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                        'text-blue-300'}
                        `}>
                            [{log.type.toUpperCase()}]
                        </span>
                        <span className="text-slate-300 break-all">
                            {log.msg}
                        </span>
                    </div>
                ))}

                {/* Typing Cursor */}
                <div className="flex items-center gap-2 text-green-500 px-2 mt-2 animate-pulse">
                    <span>_</span>
                </div>
            </div>

            {/* Status Footer */}
            <div className="bg-slate-900 px-4 py-1.5 flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-800">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3" /> CPU: 12%
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3" /> PING: 24ms
                    </span>
                </div>
                <div>
                    SESSION_ID: KOS-8392-ALPHA
                </div>
            </div>
        </div>
    );
};

export default LiveTerminal;
