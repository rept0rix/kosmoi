/**
 * ADMIN LIVE CONTROL
 *
 * The "CEO View" - watch the company run itself in real-time.
 * No clicking, no decisions needed. Just watch.
 *
 * Shows:
 * - Live agent activity feed
 * - Key metrics (updating in real-time)
 * - System status
 * - Next scheduled actions
 */

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Activity,
  DollarSign,
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  Zap,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import LiveAgentFeed from "@/components/board/LiveAgentFeed";
import { MetricsService } from "@/services/MetricsService";
import { supabase } from "@/api/supabaseClient";

export default function AdminLiveControl() {
  const [metrics, setMetrics] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [nextRun, setNextRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastTickResult, setLastTickResult] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    ceo: "checking",
    database: "checking",
    realtime: "checking",
  });

  useEffect(() => {
    loadAll();
    calculateNextRun();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadAll();
      calculateNextRun();
    }, 30000);

    // Realtime subscription for agent_tasks changes
    const channel = supabase
      .channel("live-control-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_tasks" }, () => {
        loadRecentTasks();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadMetrics(), loadGoals(), loadRecentTasks(), checkSystemStatus()]);
    setLoading(false);
  };

  const loadMetrics = async () => {
    try {
      const data = await MetricsService.getAll();
      setMetrics(data);
    } catch (e) {
      console.error("Failed to load metrics:", e);
    }
  };

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("company_goals")
        .select("*")
        .eq("status", "active")
        .order("priority", { ascending: true });
      if (!error && data) setGoals(data);
    } catch (e) {
      console.error("Failed to load goals:", e);
    }
  };

  const loadRecentTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_tasks")
        .select("id, title, status, assigned_to, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!error && data) setRecentTasks(data);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Check DB connection
      const { error: dbError } = await supabase.from("company_goals").select("id").limit(1);

      // Check last cron tick (agent_logs from core-loop-cron)
      const { data: lastTick } = await supabase
        .from("agent_logs")
        .select("created_at")
        .eq("agent_id", "core-loop-cron")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastTickAge = lastTick?.[0]
        ? (Date.now() - new Date(lastTick[0].created_at).getTime()) / 60000
        : null;

      setSystemStatus({
        ceo: lastTickAge !== null && lastTickAge < 15 ? "active" : "idle",
        database: dbError ? "error" : "connected",
        realtime: "connected",
      });
    } catch {
      setSystemStatus({ ceo: "error", database: "error", realtime: "error" });
    }
  };

  const calculateNextRun = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinute = Math.ceil(minutes / 10) * 10; // Every 10 min cron
    const diff = nextMinute - minutes;
    setNextRun(diff === 0 ? 10 : diff);
  };

  const triggerManualRun = async () => {
    setTriggering(true);
    try {
      const response = await fetch("/api/cron/agent-tick", { method: "POST" });
      const result = await response.json();
      setLastTickResult(result);
      // Reload data after trigger
      await loadAll();
    } catch (e) {
      console.error("Manual trigger failed:", e);
      setLastTickResult({ error: e.message });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Live Control
            </h1>
            <p className="text-slate-400 mt-1">צפה בחברה רצה לבד</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Next run countdown */}
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-white/10">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm">CEO Run:</span>
              <span className="font-mono text-blue-400">{nextRun} min</span>
            </div>

            {/* Manual trigger */}
            <Button
              onClick={triggerManualRun}
              disabled={triggering}
              className="bg-gradient-to-r from-blue-500 to-purple-500 disabled:opacity-50"
            >
              {triggering ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {triggering ? "Running..." : "Trigger Now"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Metrics */}
          <div className="col-span-4 space-y-4">
            {/* System Status */}
            <Card className="p-4 bg-slate-900/60 border-white/5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                System Status
              </h3>
              <div className="space-y-2">
                {Object.entries(systemStatus).map(([key, status]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{key === "ceo" ? "Cron Loop" : key}</span>
                    <Badge className={
                      status === "active" || status === "connected"
                        ? "bg-green-500/20 text-green-400"
                        : status === "idle"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : status === "checking"
                            ? "bg-slate-500/20 text-slate-400"
                            : "bg-red-500/20 text-red-400"
                    }>
                      {status === "active" ? "Active" : status === "connected" ? "Connected" : status === "idle" ? "Idle" : status === "checking" ? "..." : "Error"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Company Goals (KPI Gauges) */}
            <Card className="p-4 bg-slate-900/60 border-white/5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Company Goals
              </h3>
              <div className="space-y-3">
                {goals.map((goal) => {
                  const progress = goal.target_value > 0
                    ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                    : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 truncate">{goal.title}</span>
                        <span className="font-mono text-slate-300">
                          {goal.current_value}/{goal.target_value}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            progress >= 75 ? "bg-emerald-500" :
                            progress >= 40 ? "bg-blue-500" :
                            progress >= 10 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.max(progress, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {goals.length === 0 && (
                  <p className="text-sm text-slate-500">No goals defined</p>
                )}
              </div>
            </Card>

            {/* Recent Agent Tasks */}
            {recentTasks.length > 0 && (
              <Card className="p-4 bg-slate-900/60 border-white/5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Recent Tasks
                </h3>
                <div className="space-y-2">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 truncate max-w-[160px]">{task.title}</span>
                      <Badge className={
                        task.status === "done" ? "bg-green-500/20 text-green-400" :
                        task.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                        task.status === "open" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-slate-500/20 text-slate-400"
                      }>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Last Tick Result */}
            {lastTickResult && (
              <Card className="p-4 bg-slate-900/60 border-white/5">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                  {lastTickResult.error ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  Last Tick
                </h3>
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(lastTickResult, null, 2)}
                </pre>
              </Card>
            )}

            {/* Key Metrics */}
            <Card className="p-4 bg-slate-900/60 border-white/5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Key Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">MRR</span>
                  <span className="font-mono text-green-400">
                    ฿{metrics?.mrr?.mrr?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subscriptions</span>
                  <span className="font-mono">{metrics?.mrr?.count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conversion</span>
                  <span className="font-mono text-blue-400">
                    {metrics?.funnel?.conversionRate || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Leads</span>
                  <span className="font-mono">
                    {metrics?.pipeline?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Churn (30d)</span>
                  <span className="font-mono text-red-400">
                    {metrics?.churn?.churnRate || 0}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Agent Stats */}
            <Card className="p-4 bg-slate-900/60 border-white/5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                Agents Today
              </h3>
              <div className="space-y-2">
                {Object.entries(metrics?.agents?.byAgent || {}).map(
                  ([agent, stats]) => (
                    <div
                      key={agent}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-slate-400 truncate">{agent}</span>
                      <div className="flex gap-2">
                        <span className="text-green-400">✓{stats.success}</span>
                        <span className="text-red-400">✗{stats.failed}</span>
                      </div>
                    </div>
                  ),
                )}
                {Object.keys(metrics?.agents?.byAgent || {}).length === 0 && (
                  <p className="text-sm text-slate-500">
                    No activity yet today
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Live Feed */}
          <div className="col-span-8">
            <Card className="h-[calc(100vh-180px)] bg-slate-900/60 border-white/5">
              <LiveAgentFeed maxItems={100} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
