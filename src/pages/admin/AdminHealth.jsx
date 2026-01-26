/**
 * ADMIN HEALTH DASHBOARD
 *
 * One view to see entire company health:
 * - MRR and revenue metrics
 * - Conversion funnel
 * - Lead pipeline
 * - Churn rate
 * - Agent activity
 * - System health
 */

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Bot,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import KosmoiLoader from "@/components/ui/KosmoiLoader";
import { MetricsService } from "@/services/MetricsService";

export default function AdminHealth() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadMetrics();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    const data = await MetricsService.getAll();
    setMetrics(data);
    setLastUpdated(new Date());
    setLoading(false);
  };

  if (loading && !metrics) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <KosmoiLoader />
      </div>
    );
  }

  const { mrr, funnel, pipeline, churn, agents, health } = metrics || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Company Health
          </h1>
          <p className="text-slate-400">Real-time business metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </span>
          <Button
            onClick={loadMetrics}
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Bar */}
      <div className="flex gap-4">
        {Object.entries(health?.checks || {}).map(([key, status]) => (
          <div
            key={key}
            className="flex items-center gap-2 bg-slate-900/40 px-4 py-2 rounded-lg border border-white/5"
          >
            {status ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <Card className="p-6 bg-gradient-to-br from-green-900/40 to-emerald-900/20 border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <Badge className="bg-green-500/20 text-green-400">Revenue</Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            ฿{mrr?.mrr?.toLocaleString() || 0}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Monthly Recurring Revenue
          </p>
          <p className="text-green-400 text-xs mt-2">
            {mrr?.count || 0} active subscriptions
          </p>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6 bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <Badge className="bg-blue-500/20 text-blue-400">Conversion</Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {funnel?.conversionRate || 0}%
          </div>
          <p className="text-slate-400 text-sm mt-1">Trial → Paid Rate</p>
          <p className="text-blue-400 text-xs mt-2">
            {funnel?.active || 0} of {funnel?.total || 0} converted
          </p>
        </Card>

        {/* Leads */}
        <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-violet-900/20 border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-purple-400" />
            <Badge className="bg-purple-500/20 text-purple-400">Pipeline</Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {pipeline?.total || 0}
          </div>
          <p className="text-slate-400 text-sm mt-1">Total Leads</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(pipeline?.pipeline || {})
              .slice(0, 3)
              .map(([status, count]) => (
                <span
                  key={status}
                  className="text-xs bg-white/5 px-2 py-1 rounded"
                >
                  {status}: {count}
                </span>
              ))}
          </div>
        </Card>

        {/* Churn */}
        <Card className="p-6 bg-gradient-to-br from-red-900/40 to-orange-900/20 border-red-500/20">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <Badge className="bg-red-500/20 text-red-400">Churn</Badge>
          </div>
          <div className="text-3xl font-bold text-white">
            {churn?.churnRate || 0}%
          </div>
          <p className="text-slate-400 text-sm mt-1">30-Day Churn Rate</p>
          <p className="text-red-400 text-xs mt-2">
            {churn?.cancelled || 0} cancelled
          </p>
        </Card>
      </div>

      {/* Agent Activity Section */}
      <Card className="p-6 bg-slate-900/40 border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold">Agent Activity Today</h2>
          <Badge variant="outline" className="ml-2">
            {agents?.total || 0} decisions
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(agents?.byAgent || {}).map(([agent, stats]) => (
            <div key={agent} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-sm">{agent}</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-green-400">
                  ✓ {stats.success}
                </span>
                <span className="text-xs text-red-400">✗ {stats.failed}</span>
              </div>
            </div>
          ))}

          {Object.keys(agents?.byAgent || {}).length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No agent activity today</p>
            </div>
          )}
        </div>
      </Card>

      {/* Subscription Funnel */}
      <Card className="p-6 bg-slate-900/40 border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold">Subscription Funnel</h2>
        </div>

        <div className="flex items-end gap-4 h-32">
          {Object.entries(funnel?.funnel || {}).map(([status, count], i) => {
            const maxCount = Math.max(...Object.values(funnel?.funnel || {}));
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const colors = [
              "bg-blue-500",
              "bg-green-500",
              "bg-yellow-500",
              "bg-red-500",
              "bg-purple-500",
            ];

            return (
              <div key={status} className="flex flex-col items-center flex-1">
                <div className="text-lg font-bold mb-2">{count}</div>
                <div
                  className={`w-full rounded-t-lg ${colors[i % colors.length]}`}
                  style={{
                    height: `${height}%`,
                    minHeight: count > 0 ? "20%" : "0",
                  }}
                />
                <div className="mt-2 text-xs text-slate-400 capitalize">
                  {status}
                </div>
              </div>
            );
          })}

          {Object.keys(funnel?.funnel || {}).length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500 w-full">
              No subscription data yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
