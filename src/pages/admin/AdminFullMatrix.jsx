import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Network, Users, RefreshCw, ChevronRight, Layers,
  CheckCircle, Clock, Pause, Zap, Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Wave Card ──────────────────────────────────────────────────
function WaveCard({ wave, agents }) {
  const [expanded, setExpanded] = useState(wave.status === 'active');
  const waveAgents = agents.filter(a => a.activation_wave === wave.wave);

  const statusColor = {
    active: 'border-emerald-500/30 bg-emerald-500/5',
    completed: 'border-cyan-500/30 bg-cyan-500/5',
    pending: 'border-slate-700 bg-black/20',
  };

  const deptGroups = {};
  for (const a of waveAgents) {
    const dept = a.department || 'general';
    if (!deptGroups[dept]) deptGroups[dept] = [];
    deptGroups[dept].push(a);
  }

  const deptColors = {
    executive: 'text-amber-400',
    sales: 'text-cyan-400',
    operations: 'text-emerald-400',
    marketing: 'text-pink-400',
    finance: 'text-amber-400',
    engineering: 'text-violet-400',
  };

  return (
    <GlassCard className={`overflow-hidden border ${statusColor[wave.status] || statusColor.pending}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold font-mono ${
          wave.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
          wave.status === 'completed' ? 'bg-cyan-500/20 text-cyan-400' :
          'bg-slate-800 text-slate-500'
        }`}>
          {wave.wave}
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{wave.name}</span>
            <Badge variant="outline" className={`text-[10px] ${
              wave.status === 'active' ? 'text-emerald-400 border-emerald-500/30' :
              wave.status === 'completed' ? 'text-cyan-400 border-cyan-500/30' :
              'text-slate-500 border-slate-700'
            }`}>
              {wave.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{wave.description}</p>
        </div>

        <Badge className="bg-white/5 text-slate-400 border-white/10 text-[10px] font-mono">
          {waveAgents.length} agents
        </Badge>

        <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {Object.entries(deptGroups).map(([dept, deptAgents]) => (
            <div key={dept}>
              <div className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 ${deptColors[dept] || 'text-slate-500'}`}>
                {dept}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {deptAgents.map(agent => (
                  <motion.div
                    key={agent.agent_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-lg border p-2 flex items-center gap-2 ${
                      agent.status === 'active' ? 'border-white/10 bg-black/20 hover:border-white/20' :
                      agent.status === 'paused' ? 'border-amber-500/20 bg-amber-500/5' :
                      'border-slate-800 bg-black/30 opacity-50'
                    } transition-all`}
                  >
                    <span className="text-lg shrink-0">{agent.avatar_emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-white truncate">{agent.display_name}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-600 font-mono">{agent.schedule}</span>
                        {agent.model_tier === 'sonnet' && (
                          <Badge className="text-[7px] bg-violet-500/10 text-violet-400 border-violet-500/30 px-1 py-0">S</Badge>
                        )}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      agent.status === 'active' ? 'bg-emerald-400' :
                      agent.status === 'paused' ? 'bg-amber-400' : 'bg-slate-600'
                    }`} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ── Stats Overview ─────────────────────────────────────────────
function MatrixStats({ data }) {
  if (!data) return null;

  const stats = [
    { label: 'Total Agents', value: data.total_agents, icon: <Users className="w-4 h-4" />, color: 'text-cyan-400' },
    { label: 'Active', value: data.active_agents, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400' },
    { label: 'Departments', value: Object.keys(data.by_department || {}).length, icon: <Layers className="w-4 h-4" />, color: 'text-violet-400' },
    { label: 'Waves', value: (data.waves || []).length, icon: <Zap className="w-4 h-4" />, color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(s => (
        <GlassCard key={s.label} className="p-3" hoverEffect>
          <div className="flex items-center gap-2 mb-1">
            <span className={s.color}>{s.icon}</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase">{s.label}</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
        </GlassCard>
      ))}
    </div>
  );
}

// ── Department Breakdown ───────────────────────────────────────
function DepartmentBreakdown({ data }) {
  if (!data?.by_department) return null;

  const total = data.total_agents || 1;
  const deptEmoji = {
    executive: '👔', sales: '🎯', operations: '⚙️', marketing: '📢',
    finance: '💰', engineering: '🔧', cortex: '🧠',
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-violet-400" />
        By Department
      </h3>
      <div className="space-y-2">
        {Object.entries(data.by_department)
          .sort(([,a], [,b]) => b - a)
          .map(([dept, count]) => {
            const pct = (count / total) * 100;
            return (
              <div key={dept} className="flex items-center gap-2">
                <span className="text-sm">{deptEmoji[dept] || '📁'}</span>
                <span className="text-xs text-slate-400 font-mono w-24 truncate">{dept}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono w-6 text-right">{count}</span>
              </div>
            );
          })}
      </div>
    </GlassCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminFullMatrix() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: matrix } = await realSupabase.rpc('get_full_matrix');
    if (matrix) setData(matrix);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400">
            Full Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            The complete autonomous organization — every agent, every department
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}
          className="border-white/10 text-slate-400">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <MatrixStats data={data} />

      {/* Department breakdown + filler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DepartmentBreakdown data={data} />

        <GlassCard className="p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-400" />
            By Role
          </h3>
          <div className="space-y-2">
            {data?.by_role && Object.entries(data.by_role)
              .sort(([,a], [,b]) => b - a)
              .map(([role, count]) => {
                const roleEmoji = { brain: '🧠', executive: '👔', department_head: '📋', worker: '⚙️', specialist: '🎯' };
                return (
                  <div key={role} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>{roleEmoji[role] || '🤖'}</span>
                      <span className="text-slate-400 font-mono">{role}</span>
                    </div>
                    <span className="text-white font-mono font-bold">{count}</span>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      </div>

      {/* Waves */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center gap-2 px-1 mb-3">
          <Zap className="w-3 h-3" />
          Activation Waves
          <div className="h-px flex-1 bg-slate-800" />
        </h2>

        <div className="space-y-3">
          {(data?.waves || []).map(wave => (
            <WaveCard key={wave.wave} wave={wave} agents={data?.agents || []} />
          ))}
        </div>
      </div>
    </div>
  );
}
