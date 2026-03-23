import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Crown, Wrench, DollarSign, Megaphone, TrendingUp,
  ArrowRight, Clock, Target, AlertTriangle, CheckCircle,
  XCircle, Zap, RefreshCw, ChevronDown, ChevronUp,
  Send, Shield, Activity, BarChart3, Briefcase
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Executive metadata
const EXEC_META = {
  ceo: { icon: Crown, color: 'amber', label: 'CEO', title: 'Chief Executive Officer', gradient: 'from-amber-500 to-yellow-500' },
  cto: { icon: Wrench, color: 'cyan', label: 'CTO', title: 'Chief Technology Officer', gradient: 'from-cyan-500 to-blue-500' },
  cfo: { icon: DollarSign, color: 'emerald', label: 'CFO', title: 'Chief Financial Officer', gradient: 'from-emerald-500 to-green-500' },
  cmo: { icon: Megaphone, color: 'orange', label: 'CMO', title: 'Chief Marketing Officer', gradient: 'from-orange-500 to-amber-500' },
  cro: { icon: TrendingUp, color: 'fuchsia', label: 'CRO', title: 'Chief Revenue Officer', gradient: 'from-fuchsia-500 to-pink-500' },
};

// ── Executive Card ─────────────────────────────────────────────────────
function ExecCard({ report, isExpanded, onToggle }) {
  const meta = EXEC_META[report.agent_id] || EXEC_META.ceo;
  const Icon = meta.icon;
  const healthScore = report.analysis?.health_score ??
                      report.analysis?.system_health_score ??
                      report.analysis?.financial_health_score ??
                      report.analysis?.marketing_health_score ??
                      report.analysis?.revenue_health_score ?? 0;

  const scoreColor = healthScore >= 80 ? 'text-emerald-400' :
                     healthScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = healthScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' :
                  healthScore >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <GlassCard className="overflow-hidden">
        {/* Header — always visible */}
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{meta.label}</span>
              <span className="text-xs text-slate-500 font-mono">{meta.title}</span>
            </div>
            <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">{report.summary}</p>
          </div>

          {/* Health Score */}
          <div className={`px-3 py-1.5 rounded-lg border ${scoreBg} flex items-center gap-2`}>
            <Activity className={`w-4 h-4 ${scoreColor}`} />
            <span className={`font-mono font-bold text-lg ${scoreColor}`}>{healthScore}</span>
          </div>

          {/* Directives count */}
          {report.directives_issued > 0 && (
            <Badge variant="outline" className="border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10">
              <Send className="w-3 h-3 mr-1" />
              {report.directives_issued}
            </Badge>
          )}

          {/* Model badge */}
          <Badge variant="outline" className={`text-xs ${report.model_used?.includes('sonnet') ? 'border-violet-500/30 text-violet-400' : 'border-slate-600 text-slate-500'}`}>
            {report.model_used?.includes('sonnet') ? '🤖' : '⚙️'}
          </Badge>

          {/* Timestamp */}
          <span className="text-xs text-slate-600 font-mono hidden lg:inline">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
          </span>

          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                {/* KPIs */}
                {report.kpis && Object.keys(report.kpis).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> KPIs
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(report.kpis).map(([key, val]) => (
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

                {/* Analysis */}
                {report.analysis && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Target className="w-3 h-3" /> Analysis
                    </h4>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      {report.analysis.top_wins && (
                        <div className="mb-2">
                          <span className="text-[10px] text-emerald-500 font-mono">WINS:</span>
                          {report.analysis.top_wins.map((w, i) => (
                            <div key={i} className="text-xs text-slate-300 flex items-start gap-1 mt-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              {w}
                            </div>
                          ))}
                        </div>
                      )}
                      {report.analysis.top_risks && (
                        <div>
                          <span className="text-[10px] text-amber-500 font-mono">RISKS:</span>
                          {report.analysis.top_risks.map((r, i) => (
                            <div key={i} className="text-xs text-slate-300 flex items-start gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                              {r}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Generic analysis fields */}
                      {!report.analysis.top_wins && !report.analysis.top_risks && (
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                          {JSON.stringify(report.analysis, null, 2).substring(0, 500)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Recommendations
                    </h4>
                    <div className="space-y-1">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="text-xs text-slate-300 bg-black/20 rounded-lg p-2 border border-white/5 flex items-start gap-2">
                          <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono pt-2 border-t border-white/5">
                  <span>⏱ {report.duration_ms}ms</span>
                  <span>🎟 {report.tokens_used} tokens</span>
                  <span>📅 {report.report_date}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

// ── Active Directives Panel ────────────────────────────────────────────
function DirectivesPanel({ directives }) {
  if (!directives?.length) {
    return (
      <GlassCard className="p-6 text-center">
        <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No active directives</p>
        <p className="text-xs text-slate-600 mt-1">Executives will issue directives during next council session</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-fuchsia-400" />
          Active Directives
          <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">{directives.length}</Badge>
        </h3>
      </div>
      <ScrollArea className="max-h-[400px]">
        <div className="p-2 space-y-2">
          {directives.map((d) => {
            const meta = EXEC_META[d.issued_by] || EXEC_META.ceo;
            const typeColors = {
              priority_shift: 'border-amber-500/30 bg-amber-500/5',
              strategy_change: 'border-violet-500/30 bg-violet-500/5',
              focus: 'border-cyan-500/30 bg-cyan-500/5',
              pause: 'border-red-500/30 bg-red-500/5',
              budget_adjust: 'border-emerald-500/30 bg-emerald-500/5',
            };

            return (
              <div
                key={d.id}
                className={`rounded-lg border p-3 ${typeColors[d.directive_type] || 'border-white/10 bg-white/5'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-${meta.color}-400 border-${meta.color}-500/30 text-[10px]`}>
                    {meta.label}
                  </Badge>
                  <span className="text-xs font-bold text-white flex-1">{d.title}</span>
                  <Badge variant="outline" className="text-[10px] text-slate-400">
                    P{d.priority}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{d.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-mono">
                  <span>→ {d.target_agent}</span>
                  <span>{d.directive_type}</span>
                  {d.expires_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(d.expires_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Council Session History ────────────────────────────────────────────
function CouncilHistory({ sessions }) {
  if (!sessions?.length) return null;

  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Council Sessions
        </h3>
      </div>
      <div className="p-2 space-y-1">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className={`w-2 h-2 rounded-full ${s.data?.executives_succeeded === s.data?.executives_run ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-xs text-slate-300 flex-1 font-mono">
              {s.data?.executives_succeeded}/{s.data?.executives_run} executives
            </span>
            <span className="text-[10px] text-slate-500">
              {s.data?.total_directives || 0} directives
            </span>
            <span className="text-[10px] text-slate-600 font-mono">
              {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function AdminExecutives() {
  const [reports, setReports] = useState([]);
  const [directives, setDirectives] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [expandedExec, setExpandedExec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, directivesRes, sessionsRes] = await Promise.all([
        // Latest report per executive
        realSupabase
          .from('executive_reports')
          .select('*')
          .order('report_date', { ascending: false })
          .limit(15),

        // Active directives
        realSupabase
          .from('agent_directives')
          .select('*')
          .eq('status', 'active')
          .order('priority', { ascending: false })
          .limit(20),

        // Recent council sessions
        realSupabase
          .from('signals')
          .select('data, created_at')
          .eq('event_type', 'executive.council_completed')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Deduplicate: keep only latest report per executive
      const latestReports = [];
      const seen = new Set();
      for (const r of (reportsRes.data || [])) {
        if (!seen.has(r.agent_id)) {
          seen.add(r.agent_id);
          latestReports.push(r);
        }
      }

      setReports(latestReports);
      setDirectives(directivesRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load executive data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // Realtime subscription for new reports
    const channel = realSupabase
      .channel('executive-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'executive_reports' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_directives' }, () => loadData())
      .subscribe();

    return () => { realSupabase.removeChannel(channel); };
  }, [loadData]);

  const triggerCouncil = async () => {
    setTriggering(true);
    try {
      const { data: { session } } = await realSupabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/executive-council`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({})
      });
      // Data will reload via realtime subscription
    } catch (err) {
      console.error('Failed to trigger council:', err);
    }
    setTriggering(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-fuchsia-400 to-cyan-400">
            Executive Council
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            C-Suite AI agents • Daily strategic analysis • Autonomous directives
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
            onClick={triggerCouncil}
            disabled={triggering}
            className="bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 border border-amber-500/30 hover:border-amber-400/50 text-amber-400 hover:text-amber-300"
          >
            {triggering ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Briefcase className="w-4 h-4 mr-2" />
            )}
            {triggering ? 'Convening...' : 'Convene Council'}
          </Button>
        </div>
      </div>

      {/* Executive Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Column (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center gap-2 px-1">
            <Crown className="w-3 h-3" />
            Latest Reports
            <div className="h-px flex-1 bg-slate-800" />
          </h2>

          {reports.length === 0 && !loading && (
            <GlassCard className="p-8 text-center">
              <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-400 font-medium">No executive reports yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Click "Convene Council" to run the first executive session
              </p>
            </GlassCard>
          )}

          {reports.map((report) => (
            <ExecCard
              key={report.id}
              report={report}
              isExpanded={expandedExec === report.agent_id}
              onToggle={() => setExpandedExec(
                expandedExec === report.agent_id ? null : report.agent_id
              )}
            />
          ))}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          <DirectivesPanel directives={directives} />
          <CouncilHistory sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
