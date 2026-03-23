import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Target, Wrench, Users, ArrowRight, Clock, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  Send, Activity, Zap, Network, ArrowUpRight, Shield,
  Brain, Crown, Eye, Briefcase, Building2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Org Chart ──────────────────────────────────────────────────────────
function OrgChart({ roster }) {
  if (!roster?.length) return null;

  const roleStyles = {
    brain: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
    executive: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    department_head: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    worker: { bg: 'bg-slate-500/10', border: 'border-slate-600', text: 'text-slate-300' },
  };

  const brain = roster.find(a => a.role === 'brain');
  const executives = roster.filter(a => a.role === 'executive');
  const deptHeads = roster.filter(a => a.role === 'department_head');
  const workers = roster.filter(a => a.role === 'worker');

  const AgentNode = ({ agent, size = 'md' }) => {
    const style = roleStyles[agent.role] || roleStyles.worker;
    const sizeClass = size === 'lg' ? 'p-3' : size === 'sm' ? 'p-1.5' : 'p-2';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border ${style.border} ${style.bg} ${sizeClass} flex items-center gap-2 min-w-0`}
      >
        <span className="text-lg shrink-0">{agent.avatar_emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-bold ${style.text} truncate`}>{agent.display_name}</div>
          <div className="text-[10px] text-slate-500 truncate">{agent.schedule}</div>
        </div>
        <div className={`w-2 h-2 rounded-full shrink-0 ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      </motion.div>
    );
  };

  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Network className="w-4 h-4 text-violet-400" />
          Organization Chart
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
            {roster.length} agents
          </Badge>
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Brain */}
        {brain && (
          <div className="flex justify-center">
            <div className="w-48"><AgentNode agent={brain} size="lg" /></div>
          </div>
        )}

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-4 bg-violet-500/30" />
        </div>

        {/* Executives */}
        <div className="flex flex-wrap justify-center gap-2">
          {executives.map(e => (
            <div key={e.agent_id} className="w-36"><AgentNode agent={e} /></div>
          ))}
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-px h-4 bg-amber-500/30" />
        </div>

        {/* Department Heads + Workers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deptHeads.map(head => {
            const teamMembers = workers.filter(w => w.reports_to === head.agent_id);
            return (
              <div key={head.agent_id} className="space-y-2">
                <AgentNode agent={head} />
                <div className="ml-6 space-y-1 border-l border-white/5 pl-3">
                  {teamMembers.map(w => (
                    <div key={w.agent_id} className="w-full"><AgentNode agent={w} size="sm" /></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Department Card ────────────────────────────────────────────────────
function DeptCard({ report, roster }) {
  const [expanded, setExpanded] = useState(false);

  const deptMeta = {
    sales: { emoji: '🎯', gradient: 'from-cyan-500 to-blue-500', label: 'Sales' },
    operations: { emoji: '⚙️', gradient: 'from-emerald-500 to-teal-500', label: 'Operations' },
  };
  const meta = deptMeta[report.department] || { emoji: '📁', gradient: 'from-slate-500 to-slate-600', label: report.department };

  const teamPerf = report.team_performance || {};
  const agentIds = Object.keys(teamPerf);
  const performing = agentIds.filter(a => teamPerf[a]?.status === 'performing').length;
  const struggling = agentIds.filter(a => teamPerf[a]?.status === 'struggling').length;
  const idle = agentIds.filter(a => teamPerf[a]?.status === 'idle').length;

  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
      >
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg text-2xl`}>
          {meta.emoji}
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{meta.label} Department</span>
            <Badge variant="outline" className="text-[10px] text-slate-500">{report.head_agent_id}</Badge>
          </div>
          <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">{report.summary}</p>
        </div>

        {/* Team status badges */}
        <div className="flex items-center gap-1.5">
          {performing > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
              <CheckCircle className="w-3 h-3 mr-0.5" />{performing}
            </Badge>
          )}
          {struggling > 0 && (
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
              <AlertTriangle className="w-3 h-3 mr-0.5" />{struggling}
            </Badge>
          )}
          {idle > 0 && (
            <Badge className="bg-slate-500/10 text-slate-400 border-slate-600 text-[10px]">
              <Clock className="w-3 h-3 mr-0.5" />{idle}
            </Badge>
          )}
        </div>

        {/* Micro-directives count */}
        {(report.micro_directives?.length || 0) > 0 && (
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px]">
            <Send className="w-3 h-3 mr-0.5" />{report.micro_directives.length}
          </Badge>
        )}

        <span className="text-xs text-slate-600 font-mono hidden lg:inline">
          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
        </span>

        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
              {/* Team Performance */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Users className="w-3 h-3" /> Team Performance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {agentIds.map(agentId => {
                    const perf = teamPerf[agentId];
                    const agent = roster?.find(r => r.agent_id === agentId);
                    const statusColor = perf.status === 'performing' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                        perf.status === 'struggling' ? 'border-red-500/30 bg-red-500/5' :
                                        'border-slate-700 bg-black/20';

                    return (
                      <div key={agentId} className={`rounded-lg border p-3 ${statusColor}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{agent?.avatar_emoji || '🤖'}</span>
                          <span className="text-xs font-bold text-white">{agent?.display_name || agentId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{perf.status}</span>
                          <span className={`text-sm font-mono font-bold ${
                            perf.success_rate >= 80 ? 'text-emerald-400' :
                            perf.success_rate >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>{perf.success_rate}%</span>
                        </div>
                        {perf.notes && <p className="text-[10px] text-slate-500 mt-1">{perf.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metrics */}
              {report.metrics && Object.keys(report.metrics).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(report.metrics).map(([key, val]) => (
                      <div key={key} className="bg-black/20 rounded-lg p-2 border border-white/5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {typeof val === 'number' ? val.toLocaleString() : String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Micro-directives */}
              {report.micro_directives?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Send className="w-3 h-3" /> Micro-Directives Issued
                  </h4>
                  <div className="space-y-1">
                    {report.micro_directives.map((md, i) => (
                      <div key={i} className="text-xs text-slate-300 bg-black/20 rounded-lg p-2 border border-white/5 flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                        <span className="flex-1">
                          <span className="text-cyan-400 font-mono">{md.target}</span> → {md.type}: {md.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Escalations */}
              {report.escalations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ArrowUpRight className="w-3 h-3 text-amber-400" /> Escalations
                  </h4>
                  <div className="space-y-1">
                    {report.escalations.map((esc, i) => {
                      const sevColor = esc.severity === 'high' ? 'border-red-500/30 bg-red-500/5' :
                                       esc.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
                                       'border-slate-700 bg-black/20';
                      return (
                        <div key={i} className={`text-xs text-slate-300 rounded-lg p-2 border ${sevColor} flex items-start gap-2`}>
                          <AlertTriangle className={`w-3 h-3 mt-0.5 shrink-0 ${
                            esc.severity === 'high' ? 'text-red-400' : 'text-amber-400'
                          }`} />
                          <span className="flex-1">
                            → <span className="font-mono text-amber-400">{esc.to?.toUpperCase()}</span>: {esc.issue}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{esc.severity}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono pt-2 border-t border-white/5">
                <span>⏱ {report.duration_ms}ms</span>
                <span>🤖 {report.model_used}</span>
                <span>📅 {report.report_period}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AdminDepartments() {
  const [roster, setRoster] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rosterRes, reportsRes] = await Promise.all([
        realSupabase.rpc('get_org_chart'),
        realSupabase
          .from('department_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setRoster(rosterRes.data || []);

      // Deduplicate: latest report per department
      const latestReports = [];
      const seen = new Set();
      for (const r of (reportsRes.data || [])) {
        if (!seen.has(r.department)) {
          seen.add(r.department);
          latestReports.push(r);
        }
      }
      setReports(latestReports);
    } catch (err) {
      console.error('Failed to load department data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const channel = realSupabase
      .channel('dept-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'department_reports' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_roster' }, () => loadData())
      .subscribe();

    return () => { realSupabase.removeChannel(channel); };
  }, [loadData]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await realSupabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/department-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({})
      });
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400">
            Departments
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            Org chart • Team performance • Mid-level coordination
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-white/10 text-slate-400 hover:text-white hover:border-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={triggerSync}
            disabled={syncing}
            className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400 hover:text-cyan-300"
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Run Department Sync'}
          </Button>
        </div>
      </div>

      {/* Org Chart */}
      <OrgChart roster={roster} />

      {/* Department Reports */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center gap-2 px-1 mb-3">
          <Briefcase className="w-3 h-3" />
          Department Reports
          <div className="h-px flex-1 bg-slate-800" />
        </h2>

        {reports.length === 0 && !loading && (
          <GlassCard className="p-8 text-center">
            <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-400 font-medium">No department reports yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Click "Run Department Sync" to generate the first reports
            </p>
          </GlassCard>
        )}

        <div className="space-y-3">
          {reports.map(report => (
            <DeptCard key={report.id} report={report} roster={roster} />
          ))}
        </div>
      </div>
    </div>
  );
}
