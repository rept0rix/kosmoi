import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/AdminService";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import KosmoiLoader from "@/components/ui/KosmoiLoader";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    mrr: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await AdminService.getStats();
        setStats(data);
      } catch (e) {
        console.error("Stats Load Failed", e);
        toast({
          title: "Failed to load dashboard stats",
          description: "Please inspect the console for details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <KosmoiLoader />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
            <div className="text-xs font-mono text-emerald-500 tracking-widest">
              SYSTEM_OPTIMAL
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            MISSION{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
              CONTROL
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            // LIVE_OPERATIONAL_DATA_STREAM
          </p>
        </div>

        <div className="flex gap-3">
          <NeonButton variant="ghost" size="sm" className="hidden md:flex">
            <Activity className="w-4 h-4 text-emerald-400" />
            Waitlist Active
          </NeonButton>
          <NeonButton
            variant="cyan"
            size="sm"
            className="shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Zap className="w-4 h-4" />
            DEPLOY_AGENT
          </NeonButton>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="TOTAL_NODES"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6 text-neon-cyan" />}
          trend="+12% CAPACITY"
          variant="cyan"
          delay={0}
        />
        <StatCard
          title="ACTIVE_BUSINESSES"
          value={stats.totalBusinesses}
          icon={<Building2 className="w-6 h-6 text-fuchsia-400" />}
          trend="VERIFYING..."
          variant="pink"
          delay={0.1}
        />
        <StatCard
          title="MONTHLY_REVENUE"
          value={`$${stats.mrr || 0}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
          trend="LIVE_CALC"
          variant="emerald"
          delay={0.2}
        />
        <StatCard
          title="SUBSCRIPTION_LINK"
          value={stats.activeSubscriptions}
          icon={<TrendingUp className="w-6 h-6 text-amber-400" />}
          trend="GOLD_TIER_LEAD"
          variant="gold"
          delay={0.3}
        />
      </div>

      {/* Main Dashboard Area (Placeholder for Maps/Terminal) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        <GlassCard
          variant="default"
          className="lg:col-span-2 p-0 relative overflow-hidden group"
        >
          {/* Radar Scan Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)] opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(6,182,212,0.2)_360deg)] animate-[spin_4s_linear_infinite] rounded-full pointer-events-none mix-blend-screen"></div>

          {/* Grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          ></div>

          <div className="relative z-10 w-full h-full flex items-center justify-center flex-col">
            <Activity className="w-16 h-16 text-neon-cyan/50 mb-6 animate-pulse" />
            <h3 className="text-neon-cyan font-mono text-xl tracking-widest text-shadow mb-2">
              HOST_CONNECTION_OFFLINE
            </h3>
            <p className="text-slate-500 text-xs font-mono border border-slate-700 px-3 py-1 rounded bg-black/50">
              AWAITING_HYPERLOOP_LINK
            </p>
          </div>
        </GlassCard>

        <GlassCard
          variant="premium"
          className="p-0 overflow-hidden flex flex-col border-neon-purple/20"
        >
          <div className="bg-slate-900/80 p-3 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
            <span className="text-xs font-mono text-neon-purple/80 tracking-widest">
              TERMINAL_REF_01
            </span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="flex-1 bg-black/60 p-4 font-mono text-xs text-slate-400 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neon-purple/20">
            <p className="opacity-50">
              <span className="text-emerald-500 mr-2">➜</span> system init...
            </p>
            <p className="opacity-70">
              <span className="text-emerald-500 mr-2">➜</span> connecting
              databases...{" "}
              <span className="text-white bg-emerald-500/20 px-1 rounded">
                OK
              </span>
            </p>
            <p>
              <span className="text-emerald-500 mr-2">➜</span> loading agents...
            </p>
            <p className="text-slate-300 pl-6 border-l border-slate-700 ml-1">
              loaded: Sarah (Sales)
            </p>
            <p className="text-slate-300 pl-6 border-l border-slate-700 ml-1">
              loaded: Dave (Marketing)
            </p>
            <p className="animate-pulse mt-4">
              <span className="text-neon-cyan mr-2">ℹ</span> awaiting input_
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, variant = "cyan", delay = 0 }) {
  const glowColors = {
    cyan: "shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] border-cyan-500/20 hover:border-cyan-500/50",
    pink: "shadow-[0_0_30px_-5px_rgba(217,70,239,0.15)] border-fuchsia-500/20 hover:border-fuchsia-500/50",
    emerald:
      "shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] border-emerald-500/20 hover:border-emerald-500/50",
    gold: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] border-amber-500/20 hover:border-amber-500/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5 }}
    >
      <GlassCard
        className={`p-6 hover:scale-[1.02] transition-all duration-300 group ${glowColors[variant]} bg-slate-900/40`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono group-hover:text-slate-300 transition-colors">
              {title}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">{trend}</div>
          </div>
          <div
            className={`p-3 rounded-xl bg-slate-950/50 border border-white/5 group-hover:bg-white/5 transition-colors shadow-inner`}
          >
            {icon}
          </div>
        </div>
        <div className="text-3xl font-mono font-bold text-white tracking-tight">
          {value}
        </div>
      </GlassCard>
    </motion.div>
  );
}
