import React, { useEffect, useState } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target, TrendingUp, AlertTriangle, BookOpen,
  CheckCircle, Clock, Wifi, WifiOff, Activity,
  ChevronRight, Users, ShoppingCart, Building2
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// ── Worker Status Panel ─────────────────────────────────────────────────────

function WorkerStatusPanel() {
  const [heartbeat, setHeartbeat] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await realSupabase
        .from('company_knowledge')
        .select('value, updated_at')
        .eq('key', 'WORKER_HEARTBEAT')
        .single();

      if (data) {
        setHeartbeat(data);
        const age = Date.now() - new Date(data.updated_at).getTime();
        setOnline(age < 3 * 60 * 1000); // online if heartbeat < 3 min ago
      }
    };
    fetch();
    const t = setInterval(fetch, 30_000);
    return () => clearInterval(t);
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
            <span className={`w-3 h-3 rounded-full ${online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-red-500'}`} />
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
};

function GoalsPanel() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await realSupabase
        .from('business_goals')
        .select('*')
        .eq('status', 'active')
        .order('priority', { ascending: true });
      if (data) setGoals(data);
    };
    fetch();
  }, []);

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" /> Business Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 && (
          <p className="text-xs text-slate-600 font-mono">No active goals</p>
        )}
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
          const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
          const Icon = METRIC_ICONS[goal.target_metric] || TrendingUp;
          const color = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500';

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
                    {goal.current_value}/{goal.target_value}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>{pct}% complete</span>
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
    const fetch = async () => {
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
    fetch();
  }, []);

  const metrics = [
    { key: 'leads_today', label: 'Leads Today', icon: Users },
    { key: 'bookings_today', label: 'Bookings', icon: ShoppingCart },
    { key: 'verified_businesses', label: 'Verified Biz', icon: Building2 },
    { key: 'new_businesses_today', label: 'New Biz', icon: TrendingUp },
  ];

  const getBadgeColor = (key, value) => {
    const thr = thresholds[key];
    if (!thr) return 'bg-slate-700/50 text-slate-400';
    if (value <= thr.critical_threshold) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (value <= thr.warning_threshold) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  return (
    <Card className="bg-slate-900/40 border-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" /> KPI Today
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
                <div key={key} className={`rounded-lg border p-3 ${getBadgeColor(key, val)}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3" />
                    <span className="text-[10px] font-mono uppercase tracking-wide">{label}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">{val}</span>
                </div>
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
    const fetch = async () => {
      const { data } = await realSupabase
        .from('escalations')
        .select('*, agent_tasks(title)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setEscalations(data);
    };
    fetch();

    const sub = realSupabase
      .channel('escalations:open')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalations' }, fetch)
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
                <div key={esc.id} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
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
                </div>
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
    const fetch = async () => {
      const { data } = await realSupabase
        .from('company_knowledge')
        .select('value, updated_at')
        .eq('key', 'WORKER_LEARNINGS')
        .single();
      if (data) {
        setLessons(typeof data.value === 'string' ? data.value : JSON.stringify(data.value, null, 2));
        setUpdatedAt(data.updated_at);
      }
    };
    fetch();
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

// ── Main AutonomyDashboard ──────────────────────────────────────────────────

export function AutonomyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WorkerStatusPanel />
        <KpiTodayPanel />
      </div>
      <GoalsPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EscalationsPanel />
        <LessonsPanel />
      </div>
    </div>
  );
}

export default AutonomyDashboard;
