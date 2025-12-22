import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, Activity, Search, Filter,
    MoreHorizontal, CheckCircle, XCircle, Mail, Phone,
    Shield, Monitor, Database, Download, Cpu, Grid, LayoutDashboard, Network,
    DollarSign, Building2, TrendingUp, Plus, ListTodo, Settings, Terminal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import LiveTerminal from '@/components/LiveTerminal';
import NeuralCanvas from '@/components/NeuralCanvas';
import { agents } from '@/features/agents/services/AgentRegistry';
import { AdminService } from '@/services/AdminService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StatCard = ({ title, value, change, icon: Icon, color, subtext }) => (
    <div className="bg-background/40 border border-border p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group hover:border-primary/20 transition-all shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-xs font-outfit font-bold uppercase tracking-wider">{title}</h3>
            <div className={`p-2.5 rounded-xl bg-background border border-border/50 shadow-inner ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div className="flex flex-col gap-1 relative z-10">
            <span className="text-3xl font-bold text-foreground font-outfit tracking-tight">{value}</span>
            {change && (
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {change}
                    </span>
                    {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
                </div>
            )}
        </div>
    </div>
);

const QuickActionCard = ({ title, description, icon: Icon, to, colorClass }) => (
    <Link to={to} className="block group">
        <div className="h-full bg-background/40 border border-border p-6 rounded-2xl backdrop-blur-sm hover:bg-muted/30 hover:border-primary/30 transition-all cursor-pointer shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-${colorClass}-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform`} />
            <div className={`w-12 h-12 rounded-xl bg-${colorClass}-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-6 h-6 text-${colorClass}-500`} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    </Link>
);

const CommandCenter = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, mrr: 0, activeSubscriptions: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [activeTab, setActiveTab] = useState("business"); // business | network

    // Fetch Stats
    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await AdminService.getStats();
                setStats(data);
            } catch (e) {
                console.error("Failed to load dashboard stats", e);
            } finally {
                setLoadingStats(false);
            }
        };
        loadStats();
    }, []);

    // Mock Recent Activity
    const recentActivity = [
        { id: 1, action: "New Lead Created", subject: "Siam Paragon Retail", time: "2 mins ago", type: "success" },
        { id: 2, action: "Task Completed", subject: "Update Vendor Contracts", time: "15 mins ago", type: "info" },
        { id: 3, action: "System Alert", subject: "Database Backup Successful", time: "1 hour ago", type: "neutral" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <div className="max-w-7xl mx-auto p-8 space-y-8">

                {/* Header & Tabs */}
                <div className="flex items-end justify-between pb-6 border-b border-border/40">
                    <div>
                        <h1 className="text-4xl font-outfit font-bold tracking-tight text-foreground">
                            Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Admin</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">Here's what's happening in your business today.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Toggles */}
                        <div className="bg-muted/30 p-1 rounded-lg border border-border flex items-center">
                            <button
                                onClick={() => setActiveTab('business')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'business' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutDashboard className="w-4 h-4" /> Business Pulse
                            </button>
                            <button
                                onClick={() => setActiveTab('network')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'network' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Network className="w-4 h-4" /> Agent Network
                            </button>
                        </div>
                    </div>
                </div>

                {/* CONTENT: Business View */}
                {activeTab === 'business' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Business Pulse Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Revenue"
                                value={`฿${(stats.mrr * 34).toLocaleString()}`}
                                change="+12.5%"
                                subtext="vs last month"
                                icon={DollarSign}
                                color="text-emerald-500"
                            />
                            <StatCard
                                title="Active Businesses"
                                value={stats.totalBusinesses}
                                change="+3"
                                subtext="new this week"
                                icon={Building2}
                                color="text-blue-500"
                            />
                            <StatCard
                                title="Total Users"
                                value={stats.totalUsers}
                                change="+8%"
                                subtext="growth rate"
                                icon={Users}
                                color="text-purple-500"
                            />
                            <StatCard
                                title="Pending Tasks"
                                value="12"
                                change="-2"
                                subtext="since yesterday"
                                icon={ListTodo}
                                color="text-amber-500"
                            />
                        </div>

                        {/* Quick Actions Grid */}
                        <div>
                            <h2 className="text-xl font-outfit font-semibold mb-4 flex items-center gap-2">
                                <Grid className="w-5 h-5 text-primary" /> Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <QuickActionCard
                                    title="New Lead"
                                    description="Add a potential client to the CRM pipeline."
                                    icon={Plus}
                                    to="/admin/crm"
                                    colorClass="blue"
                                />
                                <QuickActionCard
                                    title="Manage Tasks"
                                    description="Review and update your team's tasks."
                                    icon={CheckCircle}
                                    to="/admin/tasks"
                                    colorClass="emerald"
                                />
                                <QuickActionCard
                                    title="Agent Network"
                                    description="Monitor and configure your AI workforce."
                                    icon={Cpu}
                                    to="/admin/agents"
                                    colorClass="purple"
                                />
                                <QuickActionCard
                                    title="Workflows"
                                    description="Build and visualize automation pipelines."
                                    icon={Network}
                                    to="/admin/studio"
                                    colorClass="amber"
                                />
                                <QuickActionCard
                                    title="Network Graph"
                                    description="Explore the relationships within your agent network."
                                    icon={Grid}
                                    to="/admin/evolution"
                                    colorClass="rose"
                                />
                                <QuickActionCard
                                    title="Settings"
                                    description="Configure system preferences and users."
                                    icon={Settings}
                                    to="/admin/settings"
                                    colorClass="slate"
                                />
                            </div>
                        </div>

                        {/* Recent Activity & System Health */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                            <div className="lg:col-span-2 bg-background/40 border border-border rounded-2xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-muted-foreground" /> Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    {recentActivity.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${item.type === 'success' ? 'bg-emerald-500' : item.type === 'info' ? 'bg-blue-500' : 'bg-slate-500'}`} />
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                                                    <p className="text-xs text-muted-foreground">{item.subject}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-mono">{item.time}</span>
                                        </div>
                                    ))}
                                    <div className="text-center pt-2">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">View Full Log</Button>
                                    </div>
                                </div>
                            </div>
                            {/* System Status / Mini-Monitor */}
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-200">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                    <Monitor className="w-4 h-4 text-emerald-500" /> System Status
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Database (RxDB)</span>
                                            <span className="text-emerald-400">Connected</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[98%] rounded-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Sync Status (Supabase)</span>
                                            <span className="text-blue-400">Syncing</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[100%] rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Agent Workforce</span>
                                            <span className="text-yellow-400">Standby</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-yellow-500 w-[30%] rounded-full" />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800/50">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500">Version</span>
                                            <span className="font-mono text-slate-300">v2.4.0-stable</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT: Network View (Restored) */}
                {activeTab === 'network' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* 1. THE NEURAL HEADER: Stats & Neural Brain */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                            {/* Left: Enhanced Neural Viz */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
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
                    </div>
                )}


            </div>
        </div>
    );
};

export default CommandCenter;
