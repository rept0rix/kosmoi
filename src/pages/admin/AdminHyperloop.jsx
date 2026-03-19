import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { supabase } from "@/api/supabaseClient";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n, prefix = "") =>
  n == null ? "—" : `${prefix}${Number(n).toLocaleString()}`;

const ago = (ts) => {
  if (!ts || ts === "never") return "never";
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const EVENT_COLORS = {
  "brain.snapshot": "text-blue-400",
  "brain.action_taken": "text-green-400",
  "brain.action_failed": "text-red-400",
  "invitation.sent": "text-purple-400",
  "invitation.send_failed": "text-orange-400",
  "subscription.cancelled": "text-red-500",
  "subscription.plan_purchased": "text-emerald-400",
  "lead.no_email": "text-yellow-500",
  "leads.batch_scouted": "text-cyan-400",
  "booking.payment_received": "text-emerald-300",
  "provider.claimed": "text-lime-400",
};

const ALERT_ICON = {
  CHURN: <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
  ZERO_MRR: <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />,
  OUTREACH_FAILURE: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />,
  STALE_LEADS: <Clock className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatPill = ({ label, value, sub, accent = "text-white" }) => (
  <div className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 min-w-[110px]">
    <span className={`text-xl font-bold tabular-nums ${accent}`}>{value}</span>
    <span className="text-[11px] text-slate-400 leading-tight">{label}</span>
    {sub && <span className="text-[10px] text-slate-600 leading-tight">{sub}</span>}
  </div>
);

const GoalBar = ({ title, pct, current, target, metric }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-slate-300 truncate max-w-[60%]">{title}</span>
      <span className="text-xs text-slate-500 tabular-nums">
        {fmt(current)} / {fmt(target)}
      </span>
    </div>
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct ?? 0, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
    <div className="text-right text-[10px] text-slate-600">{pct ?? 0}%</div>
  </div>
);

const SignalRow = ({ sig }) => {
  const color = EVENT_COLORS[sig.event_type] || "text-slate-400";
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0 group"
    >
      <span className={`text-[11px] font-mono ${color} shrink-0 mt-0.5`}>
        {sig.event_type}
      </span>
      <span className="text-[10px] text-slate-500 ml-auto shrink-0">
        {ago(sig.created_at)}
      </span>
    </motion.div>
  );
};

const DecisionRow = ({ dec }) => {
  const ok = dec.success;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-2.5 rounded-lg bg-white/5 border border-white/5 mb-2"
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        )}
        <span className="text-xs text-slate-300 font-medium truncate">
          {dec.decision_type || "NONE"}
        </span>
        <span className="text-[10px] text-slate-600 ml-auto shrink-0">
          {ago(dec.created_at)}
        </span>
      </div>
      {dec.context?.actions_executed > 0 && (
        <div className="mt-1 text-[10px] text-slate-500 pl-5">
          {dec.context.actions_executed} action(s) executed
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminHyperloop = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState(null);
  const intervalRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [{ data: snap }, { data: decs }, { data: sigs }] = await Promise.all([
        supabase.rpc("get_platform_snapshot"),
        supabase
          .from("agent_decisions")
          .select("id, agent_id, decision_type, context, success, created_at")
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("signals")
          .select("id, event_type, source, created_at, processed")
          .order("created_at", { ascending: false })
          .limit(40),
      ]);

      if (snap) setSnapshot(snap);
      if (decs) setDecisions(decs);
      if (sigs) setSignals(sigs);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("AdminHyperloop fetchAll failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 60-second refresh
  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 60_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  // Realtime: prepend new signals + decisions without full refetch
  useEffect(() => {
    const channel = supabase
      .channel("brain-monitor")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signals" },
        (payload) => {
          setSignals((prev) => [payload.new, ...prev].slice(0, 40));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_decisions" },
        (payload) => {
          setDecisions((prev) => [payload.new, ...prev].slice(0, 15));
          // Refresh snapshot when brain acts
          fetchAll();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll]);

  const triggerBrain = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      const { error } = await supabase.functions.invoke("cron-worker", {
        body: { type: "MANUAL_TRIGGER", timestamp: new Date().toISOString() },
      });
      setTriggerMsg(error ? `Error: ${error.message}` : "Brain cycle triggered ✓");
      if (!error) setTimeout(fetchAll, 3000);
    } catch (e) {
      setTriggerMsg(`Failed: ${e.message}`);
    } finally {
      setTriggering(false);
      setTimeout(() => setTriggerMsg(null), 5000);
    }
  };

  const h = snapshot?.health ?? {};
  const g = snapshot?.growth ?? {};
  const p = snapshot?.pipeline ?? {};
  const b = snapshot?.brain ?? {};
  const goals = snapshot?.goals ?? [];
  const alerts = snapshot?.alerts ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <Brain className="w-6 h-6 animate-pulse text-blue-400" />
          <span className="text-sm">Reading platform snapshot…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Brain Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            What the autonomous brain sees right now
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Last refresh */}
          <span className="text-[11px] text-slate-600 font-mono">
            {lastRefresh ? `synced ${ago(lastRefresh)}` : "syncing…"}
          </span>

          {/* Manual refresh */}
          <button
            onClick={fetchAll}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Trigger Brain */}
          <button
            onClick={triggerBrain}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-wait transition text-sm text-blue-300 font-medium"
          >
            <Zap className="w-3.5 h-3.5" />
            {triggering ? "Running…" : "Trigger Brain"}
          </button>

          {/* Online badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
            <Wifi className="w-3 h-3 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Trigger feedback */}
      <AnimatePresence>
        {triggerMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`text-xs px-3 py-2 rounded-lg border ${
              triggerMsg.startsWith("Brain cycle")
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {triggerMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Alerts Banner ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-sm"
              >
                {ALERT_ICON[alert.type] || <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                <span className="text-slate-300">{alert.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Stats ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <StatPill
          label="MRR"
          value={fmt(h.mrr_thb, "฿")}
          sub={`${h.active_subscriptions ?? 0} subscriptions`}
          accent="text-emerald-400"
        />
        <StatPill
          label="Claimed"
          value={fmt(h.claimed_providers)}
          sub={`${h.claim_rate_pct ?? 0}% claim rate`}
          accent="text-blue-400"
        />
        <StatPill
          label="Unclaimed"
          value={fmt(g.unclaimed_providers)}
          sub={`${fmt(g.new_providers_24h)} new today`}
          accent="text-slate-300"
        />
        <StatPill
          label="Revenue 7d"
          value={fmt(h.revenue_7d_thb, "฿")}
          accent="text-purple-400"
        />
        <StatPill
          label="Signals"
          value={fmt(b.signals_unread)}
          sub={`${b.signals_critical ?? 0} critical`}
          accent={b.signals_critical > 0 ? "text-red-400" : "text-slate-300"}
        />
        <StatPill
          label="Brain"
          value={b.actions_24h ?? 0}
          sub={`actions today · last ${ago(b.last_action_at)}`}
          accent="text-cyan-400"
        />
        <StatPill
          label="Bookings"
          value={fmt(p.bookings_pending)}
          sub="pending"
          accent={p.bookings_pending > 0 ? "text-yellow-400" : "text-slate-400"}
        />
        <StatPill
          label="Claims"
          value={fmt(p.claims_pending)}
          sub="awaiting verification"
          accent={p.claims_pending > 0 ? "text-orange-400" : "text-slate-400"}
        />
      </div>

      {/* ── Three-Column Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Col 1: Pipeline + OKRs */}
        <div className="space-y-5">
          {/* Outreach Pipeline */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-slate-200">Outreach Pipeline</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Invites 7d", fmt(p.invites_sent_7d)],
                ["Converted", fmt(p.invites_converted)],
                ["Open rate", `${p.open_rate_pct ?? 0}%`],
                ["Conv. rate", `${p.conversion_rate_pct ?? 0}%`],
                ["No email", fmt(p.leads_no_email)],
                ["Total sent", fmt(p.invites_sent_total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 tabular-nums font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* OKRs */}
          {goals.length > 0 && (
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-200">Platform OKRs</h2>
              </div>
              {goals.map((goal, i) => (
                <GoalBar key={i} {...goal} />
              ))}
            </div>
          )}
        </div>

        {/* Col 2: Brain Decisions */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Brain Decisions</h2>
            <span className="text-[10px] text-slate-600 ml-auto">last 15 cycles</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px] pr-1">
            <AnimatePresence initial={false}>
              {decisions.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">
                  No decisions recorded yet
                </p>
              ) : (
                decisions.map((dec) => <DecisionRow key={dec.id} dec={dec} />)
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Col 3: Signal Stream */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-200">Signal Stream</h2>
            <span className="text-[10px] text-slate-600 ml-auto">live · last 40</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            <AnimatePresence initial={false}>
              {signals.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">
                  No signals yet — trigger the brain or wait for a cron cycle
                </p>
              ) : (
                signals.map((sig) => <SignalRow key={sig.id} sig={sig} />)
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="text-[10px] text-slate-700 font-mono text-right">
        Snapshot v{snapshot?.snapshot_version ?? "?"} · {snapshot?.snapshot_at ? new Date(snapshot.snapshot_at).toLocaleString() : "unknown"} · cron every 15 min
      </div>
    </div>
  );
};

export default AdminHyperloop;
