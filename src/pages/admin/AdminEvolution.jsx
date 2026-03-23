import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Flame, Users, Shield, CheckCircle, XCircle, AlertTriangle,
  Clock, RefreshCw, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
  Award, TrendingUp, TrendingDown, BarChart3, Zap, Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Grade Badge ────────────────────────────────────────────────
function GradeBadge({ grade }) {
  const config = {
    A: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    B: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    C: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    D: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    F: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  };
  const c = config[grade] || config.C;
  return (
    <Badge className={`${c.bg} ${c.text} ${c.border} text-sm font-bold font-mono px-2`}>
      {grade}
    </Badge>
  );
}

// ── HR Reviews Panel ───────────────────────────────────────────
function HRReviews({ reviews }) {
  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          Agent Performance Reviews
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
            {reviews.length}
          </Badge>
        </h3>
      </div>

      <ScrollArea className="max-h-[450px]">
        {reviews.length === 0 && (
          <div className="p-8 text-center">
            <Award className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-slate-500">No reviews yet</p>
            <p className="text-xs text-slate-600">HR Agent reviews daily</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {reviews.map(review => (
            <div key={review.id} className="p-3 hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <GradeBadge grade={review.grade} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{review.agent_id}</span>
                    <Badge variant="outline" className={`text-[10px] ${
                      review.recommendation === 'keep' ? 'text-emerald-400 border-emerald-500/30' :
                      review.recommendation === 'optimize' ? 'text-amber-400 border-amber-500/30' :
                      review.recommendation === 'retrain' ? 'text-cyan-400 border-cyan-500/30' :
                      review.recommendation === 'disable' ? 'text-red-400 border-red-500/30' :
                      'text-slate-400 border-slate-600'
                    }`}>
                      {review.recommendation}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{review.reasoning}</p>
                </div>

                <div className="text-right">
                  {review.success_rate !== null && (
                    <span className={`text-xs font-mono font-bold ${
                      review.success_rate >= 80 ? 'text-emerald-400' :
                      review.success_rate >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {review.success_rate}%
                    </span>
                  )}
                  <div className="text-[9px] text-slate-700 font-mono">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Evolution Proposals Panel ──────────────────────────────────
function Proposals({ proposals, onAction }) {
  const [expandedId, setExpandedId] = useState(null);

  const typeEmoji = {
    create_agent: '🆕',
    modify_agent: '🔧',
    disable_agent: '🔴',
    new_capability: '⚡',
    new_workflow: '🔄',
  };

  const riskColor = {
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          Evolution Proposals
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
            {proposals.filter(p => p.status === 'proposed').length} pending
          </Badge>
        </h3>
      </div>

      <ScrollArea className="max-h-[450px]">
        {proposals.length === 0 && (
          <div className="p-8 text-center">
            <Flame className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-slate-500">No proposals yet</p>
            <p className="text-xs text-slate-600">The Forge analyzes daily</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {proposals.map(p => {
            const isExpanded = expandedId === p.id;
            const isPending = p.status === 'proposed';

            return (
              <div key={p.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-lg">{typeEmoji[p.proposal_type] || '📋'}</span>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white">{p.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-700">
                        {p.proposal_type?.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`text-[9px] ${riskColor[p.risk_level] || riskColor.low}`}>
                        {p.risk_level} risk
                      </Badge>
                    </div>
                  </div>

                  <Badge variant="outline" className={`text-[10px] ${
                    p.status === 'proposed' ? 'text-amber-400 border-amber-500/30' :
                    p.status === 'approved' ? 'text-emerald-400 border-emerald-500/30' :
                    p.status === 'rejected' ? 'text-red-400 border-red-500/30' :
                    'text-slate-400 border-slate-600'
                  }`}>
                    {p.status}
                  </Badge>

                  {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                          <p className="text-xs text-slate-300">{p.description}</p>
                        </div>

                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                          <div className="text-[10px] text-slate-500 font-mono mb-1">REASONING</div>
                          <p className="text-xs text-slate-400">{p.reasoning}</p>
                        </div>

                        {p.agent_spec && (
                          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <div className="text-[10px] text-slate-500 font-mono mb-1">AGENT SPEC</div>
                            <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap">
                              {JSON.stringify(p.agent_spec, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
                          {p.estimated_daily_cost > 0 && <span>💰 ${p.estimated_daily_cost}/day</span>}
                          <span>📊 {p.expected_impact} impact</span>
                          <span>📅 {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <Button size="sm" onClick={() => onAction(p.id, 'approved')}
                              className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
                              <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" onClick={() => onAction(p.id, 'rejected')}
                              className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs">
                              <ThumbsDown className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Compliance Summary ─────────────────────────────────────────
function ComplianceSummary({ compliance }) {
  if (!compliance) return null;

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-cyan-400" />
        Compliance Status (7d)
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/20 text-center">
          <div className="text-lg font-bold text-emerald-400 font-mono">{compliance.passed}</div>
          <div className="text-[10px] text-emerald-400/60 font-mono">PASSED</div>
        </div>
        <div className="bg-amber-500/5 rounded-lg p-2 border border-amber-500/20 text-center">
          <div className="text-lg font-bold text-amber-400 font-mono">{compliance.warnings}</div>
          <div className="text-[10px] text-amber-400/60 font-mono">WARNINGS</div>
        </div>
        <div className="bg-red-500/5 rounded-lg p-2 border border-red-500/20 text-center">
          <div className="text-lg font-bold text-red-400 font-mono">{compliance.blocked}</div>
          <div className="text-[10px] text-red-400/60 font-mono">BLOCKED</div>
        </div>
      </div>

      {compliance.recent_blocks?.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Recent Violations</div>
          {compliance.recent_blocks.slice(0, 5).map((b, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] bg-red-500/5 rounded p-1.5 border border-red-500/10">
              <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-mono text-red-400">{b.agent_id}</span>
                <span className="text-slate-500 ml-1">— {b.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ── Grade Distribution ─────────────────────────────────────────
function GradeDistribution({ distribution }) {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  const total = Object.values(distribution || {}).reduce((s, n) => s + n, 0);

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-amber-400" />
        Grade Distribution
      </h3>

      <div className="space-y-2">
        {grades.map(g => {
          const count = distribution?.[g] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const colorMap = { A: 'bg-emerald-500', B: 'bg-cyan-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500' };

          return (
            <div key={g} className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white w-4">{g}</span>
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${colorMap[g]} rounded-full`}
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
export default function AdminEvolution() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: dashboard } = await realSupabase.rpc('get_evolution_dashboard');
    if (dashboard) setData(dashboard);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const channel = realSupabase
      .channel('evolution-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_reviews' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evolution_proposals' }, () => loadData())
      .subscribe();

    return () => { realSupabase.removeChannel(channel); };
  }, [loadData]);

  const handleProposalAction = async (proposalId, verdict) => {
    await realSupabase.rpc('review_proposal', {
      p_proposal_id: proposalId,
      p_verdict: verdict,
      p_reviewer: 'admin',
    });
    loadData();
  };

  const triggerHR = async () => {
    const { data: { session } } = await realSupabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hr-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    }).catch(() => {});
    setTimeout(loadData, 3000);
  };

  const triggerForge = async () => {
    const { data: { session } } = await realSupabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-forge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    }).catch(() => {});
    setTimeout(loadData, 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-400 to-violet-400">
            Evolution Lab
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            HR reviews • Compliance • Agent proposals • Self-evolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}
            className="border-white/10 text-slate-400">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={triggerHR}
            className="bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs">
            <Users className="w-4 h-4 mr-1" /> Run HR
          </Button>
          <Button size="sm" onClick={triggerForge}
            className="bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs">
            <Flame className="w-4 h-4 mr-1" /> Forge
          </Button>
        </div>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComplianceSummary compliance={data?.compliance} />
        <GradeDistribution distribution={data?.grade_distribution} />
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HRReviews reviews={data?.reviews || []} />
        <Proposals proposals={data?.proposals || []} onAction={handleProposalAction} />
      </div>
    </div>
  );
}
