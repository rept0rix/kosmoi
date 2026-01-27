import React, { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  Activity,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Shield,
  Monitor,
  Database,
  Download,
  Cpu,
  Grid,
  LayoutDashboard,
  Network,
  DollarSign,
  Building2,
  TrendingUp,
  Plus,
  ListTodo,
  Settings,
  Terminal,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LiveTerminal from "@/components/LiveTerminal";
import NeuralCanvas from "@/components/NeuralCanvas";
import { agents } from "@/features/agents/services/AgentRegistry";
import { AdminService } from "@/services/AdminService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/GlassCard";
import LiveAgentFeed from "@/components/admin/LiveAgentFeed";

const StatCard = ({ title, value, change, icon: Icon, color, subtext }) => (
  <GlassCard className="p-6 hover:scale-[1.02] transition-all bg-slate-900/60 border-white/5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest">
        {title}
      </h3>
      <div
        className={`p-2.5 rounded-xl bg-slate-950/50 border border-white/5 shadow-inner ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex flex-col gap-1 relative z-10">
      <span className="text-3xl font-bold text-white font-mono tracking-tight">
        {value}
      </span>
      {change && (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium font-mono ${change.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}
          >
            {change}
          </span>
          {subtext && (
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  </GlassCard>
);

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  to,
  colorClass,
}) => {
  const colorMap = {
    blue: "text-blue-500 group-hover:text-blue-400",
    emerald: "text-emerald-500 group-hover:text-emerald-400",
    purple: "text-purple-500 group-hover:text-purple-400",
    amber: "text-amber-500 group-hover:text-amber-400",
    rose: "text-rose-500 group-hover:text-rose-400",
    slate: "text-slate-400 group-hover:text-white",
  };

  return (
    <Link to={to} className="block group h-full">
      <GlassCard className="h-full p-6 hover:bg-slate-800/60 transition-all cursor-pointer relative overflow-hidden group-hover:scale-[1.02]">
        <div
          className={`w-12 h-12 rounded-xl bg-slate-950/50 flex items-center justify-center mb-4 border border-white/5 group-hover:border-white/20 transition-colors`}
        >
          <Icon
            className={`w-6 h-6 ${colorMap[colorClass] || "text-slate-400"} transition-colors`}
          />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1 font-heading group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-mono">
          {description}
        </p>
      </GlassCard>
    </Link>
  );
};

const CommandCenter = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    mrr: 0,
    activeSubscriptions: 0,
  });
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
    {
      id: 1,
      action: "New Lead Created",
      subject: "Siam Paragon Retail",
      time: "2 mins ago",
      type: "success",
    },
    {
      id: 2,
      action: "Task Completed",
      subject: "Update Vendor Contracts",
      time: "15 mins ago",
      type: "info",
    },
    {
      id: 3,
      action: "System Alert",
      subject: "Database Backup Successful",
      time: "1 hour ago",
      type: "neutral",
    },
  ];

  return (
    <div className="min-h-full font-sans text-slate-100 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-white/5 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              COMMAND{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                CENTER
              </span>
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              // SYSTEM_OVERVIEW_INTERFACE
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggles */}
            <div className="bg-slate-900/50 p-1 rounded-lg border border-white/5 flex items-center backdrop-blur-md">
              <button
                onClick={() => setActiveTab("business")}
                className={`px-4 py-2 rounded-md text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${activeTab === "business" ? "bg-indigo-500/20 text-indigo-300 shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Business Pulse
              </button>
              <button
                onClick={() => setActiveTab("network")}
                className={`px-4 py-2 rounded-md text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${activeTab === "network" ? "bg-purple-500/20 text-purple-300 shadow-inner" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Network className="w-4 h-4" /> Agent Network
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT: Business View */}
        {activeTab === "business" && (
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <Grid className="w-5 h-5 text-neon-cyan" /> QUICK PROTOCOLS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickActionCard
                  title="Add Lead"
                  description="Feed CRM pipeline with new entity."
                  icon={Plus}
                  to="/admin/crm"
                  colorClass="blue"
                />
                <QuickActionCard
                  title="Manage Tasks"
                  description="Review operational directives."
                  icon={CheckCircle}
                  to="/admin/tasks"
                  colorClass="emerald"
                />
                <QuickActionCard
                  title="Agent Net"
                  description="Configure AI workforce nodes."
                  icon={Cpu}
                  to="/admin/agents"
                  colorClass="purple"
                />
                <QuickActionCard
                  title="Workflows"
                  description="Build automation pipelines."
                  icon={Network}
                  to="/admin/studio"
                  colorClass="amber"
                />
                <QuickActionCard
                  title="Graph View"
                  description="Visualize relationship matrix."
                  icon={Grid}
                  to="/admin/evolution"
                  colorClass="rose"
                />
                <QuickActionCard
                  title="System config"
                  description="Modify kernel parameters."
                  icon={Settings}
                  to="/admin/settings"
                  colorClass="slate"
                />
              </div>
            </div>

            {/* Recent Activity & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              <div className="lg:col-span-2">
                <GlassCard className="p-0 h-full overflow-hidden">
                  <LiveAgentFeed />
                </GlassCard>
              </div>

              {/* System Status / Mini-Monitor */}
              <GlassCard className="p-6 bg-black/40 border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-500" /> System Status
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>DB_CONNECTION (RxDB)</span>
                      <span className="text-emerald-500">ONLINE</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[98%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>DATA_SYNC</span>
                      <span className="text-blue-400 animate-pulse">
                        SYNCING
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[100%] rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>AGENT_WORKFORCE</span>
                      <span className="text-yellow-400">STANDBY</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 w-[30%] rounded-full" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-mono">
                        KERNEL_VER
                      </span>
                      <span className="font-mono text-slate-400">
                        v2.4.0-stable
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* CONTENT: Network View (Restored) */}
        {activeTab === "network" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. THE NEURAL HEADER: Stats & Neural Brain */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Left: Enhanced Neural Viz */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden shadow-2xl group">
                  {/* Viz Header */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-slate-950/80 px-3 py-1 rounded border border-blue-500/20 backdrop-blur-sm">
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
                <LiveTerminal className="flex-1 rounded-xl border-slate-800 shadow-2xl" />
                {/* Mini Task Stream */}
                <GlassCard className="p-4 h-1/3 overflow-y-auto">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Active Operations
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-slate-950/80 p-2 rounded border-l-2 border-yellow-500 flex justify-between items-center">
                      <span className="text-xs text-slate-300 font-mono">
                        Harvesting 'Samui Map'
                      </span>
                      <span className="text-[10px] text-yellow-500 animate-pulse font-bold">
                        RUNNING
                      </span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded border-l-2 border-green-500 flex justify-between items-center">
                      <span className="text-xs text-slate-300 font-mono">
                        Sanitizing Input #842
                      </span>
                      <span className="text-[10px] text-green-500 font-bold">
                        DONE
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandCenter;
