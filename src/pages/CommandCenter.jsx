import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, Activity, Search, Filter,
    MoreHorizontal, CheckCircle, XCircle, Mail, Phone,
    Shield, Monitor, Database, Download, Cpu, Grid, LayoutDashboard, Network
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import LiveTerminal from '@/components/LiveTerminal';
import NeuralCanvas from '@/components/NeuralCanvas';
import { agents } from '@/services/agents/AgentRegistry';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-xl backdrop-blur-md relative overflow-hidden group hover:border-slate-600 transition-all">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-900/50 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-xs font-mono uppercase tracking-wider">{title}</h3>
            <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
            <span className={`text-xs font-medium ${change === 'Offline' ? 'text-red-500' : 'text-green-500'}`}>{change}</span>
        </div>
    </div>
);

const CommandCenter = () => {
    // ... existing CRM logic (kept for fallback/reference) ...
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [viewMode, setViewMode] = useState("network"); // network | grid

    // Fetch Providers
    const { data: providers = [] } = useQuery({
        queryKey: ['admin-providers'],
        queryFn: async () => [
            { id: 1, name: "Samui Cleaners Pro", category: "Cleaning", contact: "John Doe", phone: "+66 81 234 5678", email: "john@clean.com", status: "pending", date: "2024-03-20" },
            { id: 2, name: "Best Burger Lamai", category: "Food", contact: "Sarah Smith", phone: "+66 90 987 6543", email: "sarah@burger.com", status: "active", date: "2024-03-19" },
            { id: 3, name: "Island Tours Express", category: "Travel", contact: "Mike Chang", phone: "+66 61 111 2222", email: "mike@tours.com", status: "active", date: "2024-03-18" },
        ]
    });

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.contact.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Top Navigation Bar */}
            <div className="border-b border-slate-900 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/kosmoi_logo_white.svg" alt="Kosmoi Logo" className="h-8 md:h-10 w-auto" />
                    </div>

                    <div className="flex gap-2">
                        <Link to="/board-room">
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                                <LayoutDashboard className="w-4 h-4 mr-2" /> Board
                            </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="border-slate-800 bg-slate-950 text-slate-400">
                            <Activity className="w-4 h-4 mr-2 text-green-500" /> System Stable
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* 1. THE NEURAL HEADER: Stats & Neural Brain */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

                    {/* Left: Enhanced Neural Viz */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* High Level Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard title="Active Nodes" value={agents.length} change="Online" icon={Cpu} color="text-blue-500" />
                            <StatCard title="Tasks Queue" value="12" change="+3 new" icon={Activity} color="text-yellow-500" />
                            <StatCard title="Memory Usage" value="45%" change="Optimal" icon={Database} color="text-purple-500" />
                            <StatCard title="Network Load" value="12ms" change="Low Latency" icon={Network} color="text-emerald-500" />
                        </div>

                        {/* NEURAL CANVAS (The "Brain") */}
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden shadow-2xl">
                            {/* Viz Header */}
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                                <span className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest bg-slate-950/80 px-3 py-1 rounded border border-blue-500/20 backdrop-blur-sm">
                                    <Network className="w-3 h-3" /> Live Architecture
                                </span>
                            </div>

                            {/* The Canvas */}
                            <NeuralCanvas />

                            {/* Overlay Vignette */}
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#020617_150%)]"></div>
                        </div>
                    </div>

                    {/* Right: Live Terminal */}
                    <div className="lg:col-span-1 h-full flex flex-col gap-6">
                        <LiveTerminal className="flex-1" />

                        {/* Mini Task Stream */}
                        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 h-1/3 overflow-y-auto">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Active Operations
                            </h3>
                            <div className="space-y-2">
                                <div className="bg-slate-950/80 p-2 rounded border-l-2 border-yellow-500 flex justify-between items-center">
                                    <span className="text-xs text-slate-300">Harvesting 'Samui Map'</span>
                                    <span className="text-[10px] text-yellow-500 animate-pulse">RUNNING</span>
                                </div>
                                <div className="bg-slate-950/80 p-2 rounded border-l-2 border-green-500 flex justify-between items-center">
                                    <span className="text-xs text-slate-300">Sanitizing Input #842</span>
                                    <span className="text-[10px] text-green-500">DONE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. OPERATIONAL LAYER: Task & CRM (Visualizing the "Queue") */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Task Stream (Mocked for now, will connect to DB) */}
                    <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 min-h-[300px]">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Task Stream
                        </h3>
                        <div className="space-y-3">
                            {/* Example Task Card */}
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center opacity-70">
                                <div>
                                    <div className="text-xs text-blue-400 font-mono mb-1">TASK-8832</div>
                                    <div className="text-sm text-slate-300">Scrape 'Samui Map' Cities</div>
                                </div>
                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">IN PROGRESS</span>
                            </div>
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center opacity-50">
                                <div>
                                    <div className="text-xs text-green-400 font-mono mb-1">TASK-8831</div>
                                    <div className="text-sm text-slate-300">Sanitize 'Chaweng Beach' Data</div>
                                </div>
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded">DONE</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick CRM (The old layout, condensed) */}
                    <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 min-h-[300px]">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4" /> Data Ingestion (Manual)
                        </h3>
                        <div className="overflow-hidden bg-slate-950 rounded border border-slate-800">
                            {/* Simplified Table */}
                            <table className="w-full text-left text-xs text-slate-400">
                                <thead className="bg-slate-900 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredProviders.slice(0, 5).map(p => (
                                        <tr key={p.id}>
                                            <td className="px-4 py-2 text-white">{p.name}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-1.5 py-0.5 rounded ${p.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <Button size="icon" variant="ghost" className="w-6 h-6"><MoreHorizontal className="w-3 h-3" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default CommandCenter;
