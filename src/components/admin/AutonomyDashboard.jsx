import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target, TrendingUp, AlertTriangle, BookOpen,
  CheckCircle, Wifi, WifiOff, Activity,
  ChevronRight, Users, ShoppingCart, Building2, RefreshCw,
  Zap, Brain, Radio, Shield, Mail, Bot, BarChart3, Bell
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// ── Animated Number ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }) {
  const spring = useSpring(value, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, v => Math.round(v).toString());
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
}

// ── Worker Status Panel ─────────────────────────────────────────────────────

function WorkerStatusPanel() {
  const [heartbeat, setHeartbeat] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('company_knowledge')
        .select('value, updated_at')
        .eq('key', 'WORKER_HEARTBEAT')
        .single();
      if (data) {
        setHeartbeat(data);
        setOnline(Date.now() - new Date(data.updated_at).getTime() < 3 * 60 * 1000);
      }
    };
    load();

    // Realtime subscription — reacts immediately when heartbeat row is updated
    const sub = realSupabase
      .channel('autonomy:heartbeat')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'company_knowledge',
        filter: 'key=eq.WORKER_HEARTBEAT'
      }, load)
      .subscribe();

    // Fallback poll every 30 s to keep online/offline status accurate
    const t = setInterval(load, 30_000);
    return () => { sub.unsubscribe(); clearInterval(t); };
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          {online
            ? <Wifi className="w-4 h-4 text-emerald-400" />
            : <WifiOff className="w-4 h-4 text-red-400" />}
          Worker Heartbeat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${online
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse'
              : 'bg-red-500'}`} />
            <span className={`text-lg font-bold font-mono ${online ? 'text-emerald-400' : 'text-red-400'}`}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          {heartbeat && (
            <span className="text-xs text-slate-500 font-mono">
              {formatDistanceToNow(new Date(heartbeat.updated_at), { addSuffix: true })}
            </span>
          )}
        </div>
        {heartbeat?.value && (
          <p className="text-xs text-slate-600 font-mono mt-2 truncate">
            {typeof heartbeat.value === 'string' ? heartbeat.value : JSON.stringify(heartbeat.value)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Business Goals Panel ────────────────────────────────────────────────────

const METRIC_ICONS = {
  verified_businesses: Building2,
  leads_today: Users,
  bookings_today: ShoppingCart,
  claimed_providers: Building2,
  avg_provider_rating: TrendingUp,
};

function GoalsPanel() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('business_goals')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: true });
      if (data) setGoals(data);
    };
    load();

    // Live updates when any business_goal row changes
    const sub = realSupabase
      .channel('autonomy:goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_goals' }, load)
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" /> Business Goals
          <RefreshCw className="w-3 h-3 text-emerald-400 ml-auto" title="Live" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 && (
          <p className="text-xs text-slate-600 font-mono">No active goals</p>
        )}
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
          const daysLeft = goal.deadline
            ? differenceInDays(new Date(goal.deadline), new Date())
            : null;
          const Icon = METRIC_ICONS[goal.target_metric] || TrendingUp;
          const barColor = pct >= 75
            ? 'bg-emerald-500'
            : pct >= 40
              ? 'bg-blue-500'
              : 'bg-amber-500';

          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-300 font-mono">{goal.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {daysLeft !== null && (
                    <span className={`text-[10px] font-mono ${daysLeft < 14 ? 'text-rose-400' : 'text-slate-500'}`}>
                      {daysLeft}d left
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    <AnimatedNumber value={goal.current_value} />{' '}
                    / {goal.target_value}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                <AnimatedNumber value={pct} />% complete
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── KPI Today Panel ─────────────────────────────────────────────────────────

function KpiTodayPanel() {
  const [snapshot, setSnapshot] = useState(null);
  const [thresholds, setThresholds] = useState({});

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [{ data: snap }, { data: thr }] = await Promise.all([
        realSupabase.from('kpi_snapshots').select('*').eq('snapshot_date', today).single(),
        realSupabase.from('kpi_thresholds').select('*'),
      ]);
      if (snap) setSnapshot(snap);
      if (thr) {
        const map = {};
        thr.forEach(t => { map[t.metric_name] = t; });
        setThresholds(map);
      }
    };
    load();

    // Live updates when today's KPI snapshot is upserted
    const sub = realSupabase
      .channel('autonomy:kpi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_snapshots' }, load)
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  const metrics = [
    { key: 'leads_today', label: 'Leads Today', icon: Users },
    { key: 'bookings_today', label: 'Bookings', icon: ShoppingCart },
    { key: 'verified_businesses', label: 'Verified Biz', icon: Building2 },
    { key: 'new_businesses_today', label: 'New Biz', icon: TrendingUp },
  ];

  const getBadgeStyle = (key, value) => {
    const thr = thresholds[key];
    if (!thr) return 'bg-slate-700/50 text-slate-400 border-slate-700';
    if (value <= (thr.critical_threshold ?? 0))
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (value <= (thr.warning_threshold ?? 0))
      return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" /> KPI Today
          <RefreshCw className="w-3 h-3 text-emerald-400 ml-auto" title="Live" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!snapshot ? (
          <p className="text-xs text-slate-600 font-mono">No snapshot yet today</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map(({ key, label, icon: Icon }) => {
              const val = snapshot[key] ?? 0;
              return (
                <motion.div
                  key={key}
                  layout
                  className={`rounded-lg border p-3 ${getBadgeStyle(key, val)}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" />
                    <span className="text-[10px] font-mono uppercase tracking-wide">{label}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    <AnimatedNumber value={val} />
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Escalations Panel ───────────────────────────────────────────────────────

function EscalationsPanel() {
  const [escalations, setEscalations] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('escalations')
        .select('*, agent_tasks(title)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setEscalations(data);
    };
    load();

    const sub = realSupabase
      .channel('autonomy:escalations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalations' }, load)
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Open Escalations
          {escalations.length > 0 && (
            <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/50 text-[10px]">
              {escalations.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {escalations.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-mono">No open escalations</span>
          </div>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-2 pr-2">
              {escalations.map(esc => (
                <motion.div
                  key={esc.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-300 font-mono line-clamp-1">
                      {esc.agent_tasks?.title || 'Unknown Task'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {formatDistanceToNow(new Date(esc.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-400/80 font-mono mb-2 line-clamp-2">{esc.reason}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                    <ChevronRight className="w-3 h-3" />
                    <span>/approve {esc.id.slice(0, 8)}</span>
                    <span className="mx-1">·</span>
                    <span>/reject {esc.id.slice(0, 8)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ── Lessons Learned Panel ───────────────────────────────────────────────────

function LessonsPanel() {
  const [lessons, setLessons] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('company_knowledge')
        .select('value, updated_at')
        .eq('key', 'WORKER_LEARNINGS')
        .single();
      if (data) {
        setLessons(typeof data.value === 'string'
          ? data.value
          : JSON.stringify(data.value, null, 2));
        setUpdatedAt(data.updated_at);
      }
    };
    load();

    // Live update when the worker writes new lessons
    const sub = realSupabase
      .channel('autonomy:lessons')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'company_knowledge',
        filter: 'key=eq.WORKER_LEARNINGS'
      }, load)
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Lessons Learned
          {updatedAt && (
            <span className="ml-auto text-[10px] text-slate-600 font-mono font-normal">
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!lessons ? (
          <p className="text-xs text-slate-600 font-mono">No lessons recorded yet</p>
        ) : (
          <ScrollArea className="max-h-40">
            <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed pr-2">
              {lessons}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ── Signal Event Colours ─────────────────────────────────────────────────────

const EVENT_STYLE = (eventType) => {
  if (eventType?.startsWith('brain.action_failed') || eventType?.includes('failed'))
    return { dot: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' };
  if (eventType?.startsWith('brain.escalation'))
    return { dot: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' };
  if (eventType?.startsWith('goal.achieved') || eventType?.startsWith('strategy.'))
    return { dot: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' };
  if (eventType?.startsWith('brain.action_taken') || eventType?.startsWith('kpi.'))
    return { dot: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' };
  if (eventType?.startsWith('subscription.') || eventType?.startsWith('booking.'))
    return { dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' };
  return { dot: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-700/40', bg: 'bg-slate-800/30' };
};

// ── Brain Timeline ───────────────────────────────────────────────────────────

function BrainTimeline() {
  const [signals, setSignals] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [tab, setTab] = useState('signals'); // 'signals' | 'decisions'

  useEffect(() => {
    const loadSignals = async () => {
      const { data } = await realSupabase
        .from('signals')
        .select('id, event_type, source, data, processed, created_at')
        .order('created_at', { ascending: false })
        .limit(25);
      if (data) setSignals(data);
    };

    const loadDecisions = async () => {
      const { data } = await realSupabase
        .from('agent_decisions')
        .select('id, agent_id, decision_type, success, result, created_at')
        .order('created_at', { ascending: false })
        .limit(15);
      if (data) setDecisions(data);
    };

    loadSignals();
    loadDecisions();

    // Realtime: new signal arrives → prepend it
    const sigSub = realSupabase
      .channel('brain:signals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, payload => {
        setSignals(prev => [payload.new, ...prev].slice(0, 25));
      })
      .subscribe();

    // Realtime: new decision logged
    const decSub = realSupabase
      .channel('brain:decisions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_decisions' }, payload => {
        setDecisions(prev => [payload.new, ...prev].slice(0, 15));
      })
      .subscribe();

    return () => { sigSub.unsubscribe(); decSub.unsubscribe(); };
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          Brain Timeline
          <span className="ml-1 flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <div className="ml-auto flex gap-1">
            {['signals', 'decisions'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                  tab === t
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <AnimatePresence initial={false}>
            {tab === 'signals' && signals.map((sig, i) => {
              const style = EVENT_STYLE(sig.event_type);
              return (
                <motion.div
                  key={sig.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i === 0 ? 0 : 0 }}
                  className={`flex items-start gap-3 mb-2 p-2 rounded-lg border ${style.bg} ${style.border}`}
                >
                  <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    {i < signals.length - 1 && <span className="w-px h-4 bg-slate-700" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-mono font-medium truncate ${style.text}`}>
                        {sig.event_type}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono shrink-0">
                        {formatDistanceToNow(new Date(sig.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-slate-600 font-mono">{sig.source}</span>
                      {sig.processed
                        ? <span className="text-[9px] text-emerald-600 font-mono">processed</span>
                        : <span className="text-[9px] text-amber-600 font-mono">pending</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {tab === 'decisions' && decisions.map((dec, i) => (
              <motion.div
                key={dec.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-start gap-3 mb-2 p-2 rounded-lg border ${
                  dec.success
                    ? 'bg-blue-500/5 border-blue-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${dec.success ? 'text-blue-400' : 'text-red-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-medium text-slate-300 truncate">
                      {dec.decision_type}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono shrink-0">
                      {formatDistanceToNow(new Date(dec.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-slate-600 font-mono">{dec.agent_id}</span>
                    <span className={`text-[9px] font-mono ${dec.success ? 'text-emerald-500' : 'text-red-500'}`}>
                      {dec.success ? '✓ ok' : '✗ failed'}
                    </span>
                    {dec.result?.duration_ms && (
                      <span className="text-[9px] text-slate-700 font-mono">{dec.result.duration_ms}ms</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ── Strategy Confidence Panel ────────────────────────────────────────────────

function StrategyPanel() {
  const [strategies, setStrategies] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await realSupabase
        .from('strategy_store')
        .select('key, confidence, notes, updated_at')
        .order('confidence', { ascending: false });
      if (data) setStrategies(data);
    };
    load();

    const sub = realSupabase
      .channel('brain:strategies')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'strategy_store' }, load)
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" /> Strategy Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {strategies.map(s => {
          const pct = Math.round(s.confidence * 100);
          const color = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500';
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-slate-400 truncate">{s.key}</span>
                <span className="text-[11px] font-mono text-slate-500">{pct}%</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Autonomous Agents Panel ──────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'onboarding-agent',
    label: 'Onboarding',
    desc: 'Welcome email when business claims profile',
    icon: Mail,
    color: 'emerald',
    triggerSignal: 'claim.payment_completed',
    successSignal: 'onboarding.welcome_sent',
    failSignal: 'onboarding.no_email',
  },
  {
    id: 'support-agent',
    label: 'Support',
    desc: 'AI auto-reply to inbound customer emails',
    icon: Bot,
    color: 'blue',
    triggerSignal: 'email.inbound_received',
    successSignal: 'support.reply_sent',
    failSignal: 'support.reply_failed',
  },
  {
    id: 'pm-agent',
    label: 'PM Agent',
    desc: 'Weekly signal/KPI analysis → product backlog',
    icon: BarChart3,
    color: 'purple',
    triggerSignal: null,
    successSignal: 'pm.weekly_analysis_complete',
    failSignal: null,
  },
  {
    id: 'daily-briefing',
    label: 'Daily Briefing',
    desc: 'Morning Telegram summary to founder 07:00 UTC',
    icon: Bell,
    color: 'amber',
    triggerSignal: null,
    successSignal: 'brain.snapshot',
    failSignal: null,
  },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', dot: 'bg-emerald-500' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'text-blue-400',    dot: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  icon: 'text-purple-400',  dot: 'bg-purple-500' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',   dot: 'bg-amber-500' },
};

function AutonomousAgentsPanel() {
  const [agentData, setAgentData] = useState({});

  useEffect(() => {
    const load = async () => {
      // Fetch last signal for each agent's success/fail event
      const allEvents = AGENTS.flatMap(a =>
        [a.successSignal, a.failSignal].filter(Boolean)
      );

      const { data } = await realSupabase
        .from('signals')
        .select('event_type, source, created_at, data')
        .in('event_type', allEvents)
        .order('created_at', { ascending: false })
        .limit(100);

      // Index latest signal per event_type
      const byEvent = {};
      for (const row of data ?? []) {
        if (!byEvent[row.event_type]) byEvent[row.event_type] = row;
      }
      setAgentData(byEvent);
    };

    load();

    const sub = realSupabase
      .channel('autonomy:agent_signals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, load)
      .subscribe();

    return () => sub.unsubscribe();
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          Autonomous Agents
          <span className="ml-auto text-[10px] text-slate-600 font-mono font-normal">running 24/7</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENTS.map(agent => {
            const c = COLOR_MAP[agent.color];
            const Icon = agent.icon;
            const lastSuccess = agent.successSignal ? agentData[agent.successSignal] : null;
            const lastFail    = agent.failSignal    ? agentData[agent.failSignal]    : null;
            const lastRun     = lastSuccess || lastFail;
            const isOk        = !!lastSuccess && (!lastFail || new Date(lastSuccess.created_at) > new Date(lastFail.created_at));

            return (
              <motion.div
                key={agent.id}
                layout
                className={`rounded-xl border p-4 ${c.bg} ${c.border}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${c.icon}`} />
                    <span className="text-xs font-bold text-slate-200 font-mono">{agent.label}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full mt-1 ${lastRun ? (isOk ? c.dot + ' shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500') : 'bg-slate-700'}`} />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mb-3 leading-relaxed">{agent.desc}</p>
                {lastRun ? (
                  <div className="text-[10px] font-mono text-slate-600">
                    <span className={isOk ? 'text-emerald-600' : 'text-red-500'}>
                      {isOk ? '✓ last run' : '✗ last run'}
                    </span>
                    {' '}
                    <span>{formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true })}</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-slate-700">Never run yet</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main AutonomyDashboard ──────────────────────────────────────────────────

export function AutonomyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WorkerStatusPanel />
        <KpiTodayPanel />
      </div>
      <AutonomousAgentsPanel />
      <BrainTimeline />
      <GoalsPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EscalationsPanel />
        <StrategyPanel />
      </div>
      <LessonsPanel />
    </div>
  );
}

export default AutonomyDashboard;
