import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Activity, Brain, Wifi, WifiOff, Zap, AlertTriangle,
  CheckCircle, XCircle, Clock, Eye, Target, TrendingUp,
  Shield, Radio, Cpu, BarChart3, HeartPulse, Signal,
  DollarSign, Users, RefreshCw, Filter, Search,
  ArrowRight, CircleDot, Coins
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Animated Number ─────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const spring = useSpring(value, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, v => Math.round(v).toString());
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
}

// ── Brain Heartbeat Monitor ─────────────────────────────────────────────
function BrainHeartbeat() {
  const [lastBeat, setLastBeat] = useState(null);
  const [online, setOnline] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  const checkStatus = useCallback(async () => {
    const { data } = await realSupabase
      .from('signals')
      .select('data, created_at')
      .eq('event_type', 'brain.heartbeat')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setLastBeat(data);
      // Online if heartbeat within last 20 minutes (cycle is 15min)
      setOnline(Date.now() - new Date(data.created_at).getTime() < 20 * 60 * 1000);
    }

    // Count today's cycles
    const today = new Date().toISOString().split('T')[0];
    const { count } = await realSupabase
      .from('signals')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'brain.heartbeat')
      .gte('created_at', `${today}T00:00:00Z`);
    setCycleCount(count || 0);
  }, []);

  useEffect(() => {
    checkStatus();

    const channel = realSupabase
      .channel('godview:heartbeat')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'signals',
        filter: 'event_type=eq.brain.heartbeat'
      }, () => checkStatus())
      .subscribe();

    const poll = setInterval(checkStatus, 30_000);
    return () => { channel.unsubscribe(); clearInterval(poll); };
  }, [checkStatus]);

  return (
    <GlassCard variant="premium" className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
          <HeartPulse className="w-4 h-4" />
          Brain Cortex
        </h3>
        <div className={`flex items-center gap-2 ${online ? 'text-emerald-400' : 'text-red-400'}`}>
          {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-xs font-mono font-bold">{online ? 'ALIVE' : 'DEAD'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={`w-4 h-4 rounded-full ${online
          ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse'
          : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'}`}
        />
        <div>
          <div className="text-2xl font-bold font-mono text-white">
            <AnimatedNumber value={cycleCount} /> <span className="text-sm text-slate-500">cycles today</span>
          </div>
          {lastBeat && (
            <span className="text-xs text-slate-500 font-mono">
              Last beat: {formatDistanceToNow(new Date(lastBeat.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Live Signal Feed ────────────────────────────────────────────────────
function LiveSignalFeed() {
  const [signals, setSignals] = useState([]);
  const feedRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('signals')
        .select('id, event_type, source, data, created_at, processed')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setSignals(data);
    };
    load();

    const channel = realSupabase
      .channel('godview:signals')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'signals'
      }, (payload) => {
        setSignals(prev => [payload.new, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const getSignalIcon = (eventType) => {
    if (eventType.startsWith('brain.')) return <Brain className="w-3.5 h-3.5 text-purple-400" />;
    if (eventType.startsWith('payment.')) return <BarChart3 className="w-3.5 h-3.5 text-green-400" />;
    if (eventType.startsWith('lead.') || eventType.startsWith('outreach.')) return <Target className="w-3.5 h-3.5 text-cyan-400" />;
    if (eventType.startsWith('support.')) return <Shield className="w-3.5 h-3.5 text-yellow-400" />;
    if (eventType.startsWith('subscription.')) return <TrendingUp className="w-3.5 h-3.5 text-blue-400" />;
    if (eventType.startsWith('agent.')) return <Cpu className="w-3.5 h-3.5 text-fuchsia-400" />;
    return <Signal className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getSignalColor = (eventType) => {
    if (eventType.includes('failed') || eventType.includes('denied')) return 'border-l-red-500';
    if (eventType.includes('recovered') || eventType.includes('completed')) return 'border-l-emerald-500';
    if (eventType.includes('heartbeat')) return 'border-l-purple-500';
    if (eventType.includes('escalated')) return 'border-l-yellow-500';
    return 'border-l-slate-600';
  };

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          Live Nervous System
        </h3>
        <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-slate-500">
          {signals.length} signals
        </Badge>
      </div>
      <ScrollArea className="h-[400px]" ref={feedRef}>
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {signals.map((sig, i) => (
              <motion.div
                key={sig.id || i}
                initial={i === 0 ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                className={`px-5 py-3 hover:bg-white/[0.02] transition-colors border-l-2 ${getSignalColor(sig.event_type)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(sig.event_type)}
                    <span className="text-xs font-mono font-semibold text-white">
                      {sig.event_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sig.processed ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500/50" />
                    ) : (
                      <Clock className="w-3 h-3 text-yellow-500/50" />
                    )}
                    <span className="text-[10px] text-slate-600 font-mono">
                      {formatDistanceToNow(new Date(sig.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-mono border-white/5 text-slate-500">
                    {sig.source}
                  </Badge>
                  {sig.data && (
                    <span className="text-[10px] text-slate-600 font-mono truncate max-w-[300px]">
                      {typeof sig.data === 'string' ? sig.data : JSON.stringify(sig.data).substring(0, 80)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Agent Decisions Stream ──────────────────────────────────────────────
function AgentDecisions() {
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('agent_decisions')
        .select('id, agent_id, decision_type, success, result, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setDecisions(data);
    };
    load();

    const channel = realSupabase
      .channel('godview:decisions')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'agent_decisions'
      }, (payload) => {
        setDecisions(prev => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Agent Decisions
        </h3>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="divide-y divide-white/5">
          {decisions.map((d, i) => (
            <div key={d.id || i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {d.success ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className="text-xs font-mono font-semibold text-white">{d.decision_type}</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">
                  {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] font-mono border-cyan-500/20 text-cyan-400">
                  {d.agent_id}
                </Badge>
                {d.result?.message && (
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[250px]">
                    {d.result.message}
                  </span>
                )}
              </div>
            </div>
          ))}
          {decisions.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-600 text-sm font-mono">
              No decisions yet...
            </div>
          )}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── System Metrics ──────────────────────────────────────────────────────
function SystemMetrics() {
  const [metrics, setMetrics] = useState({
    signals_total: 0,
    signals_unprocessed: 0,
    decisions_today: 0,
    actions_success_rate: 0,
    active_agents: 0
  });

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];

      const [signalsTotal, signalsUnread, decisionsToday, successToday, failToday] = await Promise.all([
        realSupabase.from('signals').select('*', { count: 'exact', head: true }),
        realSupabase.from('signals').select('*', { count: 'exact', head: true }).eq('processed', false),
        realSupabase.from('agent_decisions').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00Z`),
        realSupabase.from('agent_decisions').select('*', { count: 'exact', head: true }).eq('success', true).gte('created_at', `${today}T00:00:00Z`),
        realSupabase.from('agent_decisions').select('*', { count: 'exact', head: true }).eq('success', false).gte('created_at', `${today}T00:00:00Z`),
      ]);

      const total = (successToday.count || 0) + (failToday.count || 0);
      const rate = total > 0 ? Math.round(((successToday.count || 0) / total) * 100) : 0;

      // Count unique agents active today
      const { data: activeAgents } = await realSupabase
        .from('agent_decisions')
        .select('agent_id')
        .gte('created_at', `${today}T00:00:00Z`);
      const uniqueAgents = new Set(activeAgents?.map(a => a.agent_id) || []);

      setMetrics({
        signals_total: signalsTotal.count || 0,
        signals_unprocessed: signalsUnread.count || 0,
        decisions_today: decisionsToday.count || 0,
        actions_success_rate: rate,
        active_agents: uniqueAgents.size
      });
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { title: 'Total Signals', value: metrics.signals_total, icon: Signal, color: 'text-cyan-400' },
    { title: 'Unprocessed', value: metrics.signals_unprocessed, icon: AlertTriangle, color: metrics.signals_unprocessed > 10 ? 'text-red-400' : 'text-yellow-400' },
    { title: 'Decisions Today', value: metrics.decisions_today, icon: Zap, color: 'text-purple-400' },
    { title: 'Success Rate', value: metrics.actions_success_rate, icon: CheckCircle, color: 'text-emerald-400', suffix: '%' },
    { title: 'Active Agents', value: metrics.active_agents, icon: Cpu, color: 'text-fuchsia-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card) => (
        <GlassCard key={card.title} className="p-4" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
              {card.title}
            </span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            <AnimatedNumber value={card.value} />
            {card.suffix && <span className="text-sm text-slate-500">{card.suffix}</span>}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ── Company Goals Progress ──────────────────────────────────────────────
function CompanyGoals() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('company_goals')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: true });
      if (data) setGoals(data);
    };
    load();
  }, []);

  return (
    <GlassCard className="p-5">
      <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-cyan-400" />
        Company OKRs
      </h3>
      <div className="space-y-4">
        {goals.map((goal) => {
          const pct = goal.target_value > 0
            ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
            : 0;
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-white">{goal.title}</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {goal.current_value}/{goal.target_value} ({pct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-cyan-500' : 'bg-yellow-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="text-xs text-slate-600 font-mono text-center py-4">No active goals</p>
        )}
      </div>
    </GlassCard>
  );
}

// ── Cortex Reasoning Panel ──────────────────────────────────────────────
function CortexReasoning() {
  const [reasoning, setReasoning] = useState(null);
  const [lastCycle, setLastCycle] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [reasoningRes, cycleRes] = await Promise.all([
        realSupabase
          .from('agent_working_memory')
          .select('value, updated_at')
          .eq('agent_id', 'cortex')
          .eq('key', 'last_reasoning')
          .single(),
        realSupabase
          .from('agent_working_memory')
          .select('value, updated_at')
          .eq('agent_id', 'cortex')
          .eq('key', 'last_cycle')
          .single()
      ]);
      if (reasoningRes.data) setReasoning(reasoningRes.data);
      if (cycleRes.data) setLastCycle(cycleRes.data);
    };
    load();

    const channel = realSupabase
      .channel('godview:cortex-memory')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'agent_working_memory',
        filter: 'agent_id=eq.cortex'
      }, () => load())
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const reasoningData = reasoning?.value ? (typeof reasoning.value === 'string' ? JSON.parse(reasoning.value) : reasoning.value) : null;
  const cycleData = lastCycle?.value ? (typeof lastCycle.value === 'string' ? JSON.parse(lastCycle.value) : lastCycle.value) : null;

  return (
    <GlassCard className="p-5">
      <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-purple-400" />
        Cortex Reasoning
      </h3>

      {reasoningData ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-[9px] font-mono ${
              reasoningData.mode === 'claude'
                ? 'border-purple-500/30 text-purple-400'
                : 'border-yellow-500/30 text-yellow-400'
            }`}>
              {reasoningData.mode === 'claude' ? '🤖 Claude' : '⚙️ Fallback'}
            </Badge>
            {reasoning?.updated_at && (
              <span className="text-[10px] text-slate-600 font-mono">
                {formatDistanceToNow(new Date(reasoning.updated_at), { addSuffix: true })}
              </span>
            )}
          </div>

          <div className="bg-slate-950/50 rounded-lg p-3 border border-white/5">
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {reasoningData.reasoning || 'No reasoning available'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
            <span>Proposed: {reasoningData.actions_proposed || 0}</span>
            <span>Executed: {reasoningData.actions_executed || 0}</span>
          </div>

          {cycleData?.actions_taken && (
            <div className="space-y-1">
              {cycleData.actions_taken.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                  {a.success ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-slate-400">{a.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-600 font-mono text-center py-4">
          Waiting for first Cortex cycle...
        </p>
      )}
    </GlassCard>
  );
}

// ── AI Cost Dashboard ───────────────────────────────────────────────────
function CostDashboard() {
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await realSupabase.rpc('get_ai_costs', { p_days: 7 });
    if (data) setCosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byAgent = costs?.by_agent || {};
  const dailyTrend = costs?.daily_trend || [];

  // Find max daily cost for bar chart scaling
  const maxDailyCost = Math.max(...dailyTrend.map(d => d.cost_usd || 0), 0.01);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          AI Cost Tracker
        </h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-6 px-2">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {costs ? (
        <div className="space-y-4">
          {/* Top stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/20 rounded-lg p-2 border border-white/5">
              <div className="text-[10px] text-slate-500 font-mono">TODAY</div>
              <div className="text-lg font-bold text-amber-400 font-mono">
                ${(costs.today_cost_usd || 0).toFixed(4)}
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 border border-white/5">
              <div className="text-[10px] text-slate-500 font-mono">7-DAY</div>
              <div className="text-lg font-bold text-white font-mono">
                ${(costs.total_cost_usd || 0).toFixed(4)}
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 border border-white/5">
              <div className="text-[10px] text-slate-500 font-mono">CALLS</div>
              <div className="text-lg font-bold text-cyan-400 font-mono">
                {costs.today_calls || 0}
              </div>
            </div>
          </div>

          {/* Daily trend mini chart */}
          {dailyTrend.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 font-mono mb-1">Daily trend (7d)</div>
              <div className="flex items-end gap-1 h-12">
                {dailyTrend.map((d, i) => {
                  const height = Math.max(4, (d.cost_usd / maxDailyCost) * 48);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <motion.div
                        className="w-full bg-gradient-to-t from-amber-500/40 to-amber-400/80 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                      />
                      <span className="text-[8px] text-slate-700 font-mono">
                        {d.date?.slice(8, 10)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By agent breakdown */}
          {Object.keys(byAgent).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-600 font-mono mb-1">By agent</div>
              <div className="space-y-1">
                {Object.entries(byAgent)
                  .sort(([,a], [,b]) => (b.cost_usd || 0) - (a.cost_usd || 0))
                  .slice(0, 6)
                  .map(([agentId, data]) => (
                    <div key={agentId} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">{agentId}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{data.calls} calls</span>
                        <span className="text-amber-400 font-bold">${(data.cost_usd || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Average latency */}
          <div className="text-[10px] text-slate-600 font-mono flex items-center gap-2 pt-1 border-t border-white/5">
            <Clock className="w-3 h-3" />
            Avg latency: {costs.avg_latency_ms || 0}ms
            <span className="ml-auto">{costs.total_tokens?.toLocaleString()} tokens total</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 font-mono text-center py-4">Loading costs...</p>
      )}
    </GlassCard>
  );
}

// ── Agent Health Matrix ─────────────────────────────────────────────────
function AgentHealthMatrix() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await realSupabase.rpc('get_agent_health');
      if (data) setAgents(data);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (agent) => {
    if (!agent.last_signal && !agent.last_decision) return 'bg-slate-700'; // never active
    const lastActivity = new Date(agent.last_signal || agent.last_decision);
    const minutesAgo = (Date.now() - lastActivity.getTime()) / 60000;

    if (agent.schedule === 'every_15m' && minutesAgo > 30) return 'bg-red-500';
    if (agent.schedule === 'every_4h' && minutesAgo > 300) return 'bg-red-500';
    if (agent.schedule === 'daily' && minutesAgo > 1500) return 'bg-red-500';
    if (minutesAgo < 60) return 'bg-emerald-500';
    if (minutesAgo < 240) return 'bg-amber-500';
    return 'bg-slate-500';
  };

  const roleStyles = {
    brain: 'ring-2 ring-violet-500/50',
    executive: 'ring-2 ring-amber-500/30',
    department_head: 'ring-1 ring-cyan-500/30',
    worker: '',
    specialist: '',
  };

  return (
    <GlassCard className="p-5">
      <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-fuchsia-400" />
        Agent Health Matrix
        <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-slate-500 ml-auto">
          {agents.length} agents
        </Badge>
      </h3>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {agents.map(agent => (
          <div
            key={agent.agent_id}
            className={`group relative flex flex-col items-center p-2 rounded-lg bg-black/20 border border-white/5 hover:border-white/20 transition-all ${roleStyles[agent.role] || ''}`}
          >
            <div className="relative mb-1">
              <span className="text-lg">{agent.avatar_emoji}</span>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${getHealthColor(agent)}`} />
            </div>
            <span className="text-[9px] text-slate-400 font-mono text-center truncate w-full">
              {agent.display_name?.split(' ')[0]}
            </span>
            {agent.decisions_today > 0 && (
              <span className="text-[8px] text-cyan-400 font-mono">{agent.decisions_today}d</span>
            )}

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="bg-slate-900 border border-white/10 rounded-lg p-2 shadow-xl min-w-[140px]">
                <div className="text-[10px] font-bold text-white mb-1">{agent.display_name}</div>
                <div className="text-[9px] text-slate-500 font-mono space-y-0.5">
                  <div>Role: {agent.role}</div>
                  <div>Schedule: {agent.schedule}</div>
                  <div>Today: {agent.decisions_today} decisions</div>
                  {agent.success_rate !== null && <div>Success: {agent.success_rate}%</div>}
                  {agent.last_signal && (
                    <div>Last: {formatDistanceToNow(new Date(agent.last_signal), { addSuffix: true })}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
        {[
          { color: 'bg-emerald-500', label: 'Active' },
          { color: 'bg-amber-500', label: 'Idle' },
          { color: 'bg-red-500', label: 'Overdue' },
          { color: 'bg-slate-700', label: 'Never ran' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${l.color}`} />
            <span className="text-[9px] text-slate-600 font-mono">{l.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Action Timeline ─────────────────────────────────────────────────────
function ActionTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase.rpc('get_action_timeline', { p_limit: 50 });
      if (data) setTimeline(data);
    };
    load();

    const channel = realSupabase
      .channel('godview:timeline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_decisions' }, () => load())
      .subscribe();

    return () => { realSupabase.removeChannel(channel); };
  }, []);

  const filtered = filterType === 'all' ? timeline : timeline.filter(t => t.type === filterType);

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Action Timeline
        </h3>
        <div className="flex items-center gap-1">
          {['all', 'decision', 'signal'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                filterType === f ? 'bg-white/10 text-white' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[350px]">
        <div className="relative px-5 py-2">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5" />

          {filtered.map((item, i) => {
            const isDecision = item.type === 'decision';
            return (
              <motion.div
                key={i}
                initial={i < 3 ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                className="relative flex items-start gap-3 py-2"
              >
                {/* Dot on timeline */}
                <div className="relative z-10 mt-1">
                  {isDecision ? (
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      item.success ? 'border-emerald-400 bg-emerald-400/20' :
                      item.success === false ? 'border-red-400 bg-red-400/20' :
                      'border-slate-500 bg-slate-500/20'
                    }`} />
                  ) : (
                    <CircleDot className="w-3 h-3 text-cyan-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-white">{item.action}</span>
                    <Badge variant="outline" className={`text-[8px] font-mono ${
                      isDecision ? 'border-purple-500/20 text-purple-400' : 'border-cyan-500/20 text-cyan-400'
                    }`}>
                      {item.agent_id}
                    </Badge>
                  </div>
                  {item.reason && (
                    <p className="text-[10px] text-slate-500 font-mono truncate">{item.reason}</p>
                  )}
                  <span className="text-[9px] text-slate-700 font-mono">
                    {item.ts ? formatDistanceToNow(new Date(item.ts), { addSuffix: true }) : ''}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-xs text-slate-600 font-mono text-center py-8">
              No actions today yet...
            </p>
          )}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Main God View Page ──────────────────────────────────────────────────
export default function AdminGodView() {
  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-3">
            <Eye className="w-7 h-7 text-cyan-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400">
              God View
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            The autonomous company, observed from above
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-mono">REALTIME</span>
        </div>
      </div>

      {/* Metrics Row */}
      <SystemMetrics />

      {/* Agent Health Matrix — full width */}
      <AgentHealthMatrix />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brain + Cost + Goals */}
        <div className="space-y-6">
          <BrainHeartbeat />
          <CostDashboard />
          <CompanyGoals />
        </div>

        {/* Center Column: Signal Feed + Reasoning */}
        <div className="space-y-6">
          <LiveSignalFeed />
          <CortexReasoning />
        </div>

        {/* Right Column: Timeline + Decisions */}
        <div className="space-y-6">
          <ActionTimeline />
          <AgentDecisions />
        </div>
      </div>
    </div>
  );
}
