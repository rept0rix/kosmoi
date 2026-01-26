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
  const [nextRun, setNextRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    ceo: "active",
    database: "connected",
    realtime: "connected",
  });

  useEffect(() => {
    loadMetrics();
    calculateNextRun();

    // Refresh metrics every 30 seconds
    const interval = setInterval(() => {
      loadMetrics();
      calculateNextRun();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    const data = await MetricsService.getAll();
    setMetrics(data);
    setLoading(false);
  };

  const calculateNextRun = () => {
    // CEO runs every 15 minutes (0, 15, 30, 45)
    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinute = Math.ceil(minutes / 15) * 15;
    const diff = nextMinute - minutes;
    setNextRun(diff === 0 ? 15 : diff);
  };

  const triggerManualRun = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      await fetch(`${supabaseUrl}/functions/v1/cron-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({}),
      });
      loadMetrics();
    } catch (e) {
      console.error("Manual trigger failed:", e);
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
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              <Zap className="w-4 h-4 mr-2" />
              Trigger Now
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
                <div className="flex justify-between items-center">
                  <span className="text-sm">CEO Agent</span>
                  <Badge className="bg-green-500/20 text-green-400">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-500/20 text-green-400">
                    Connected
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Realtime</span>
                  <Badge className="bg-green-500/20 text-green-400">
                    Connected
                  </Badge>
                </div>
              </div>
            </Card>

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
