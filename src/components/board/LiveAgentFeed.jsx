/**
 * LIVE AGENT FEED
 *
 * Real-time display of all agent decisions and actions.
 * Uses Supabase Realtime to show updates as they happen.
 *
 * This is the "spectator mode" - watch the company run itself.
 */

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Mail,
  MessageSquare,
  AlertTriangle,
  Users,
  Target,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AGENT_ICONS = {
  "cron-worker": { icon: Bot, color: "text-blue-400", bg: "bg-blue-500/20" },
  "payment-recovery": {
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-500/20",
  },
  "sales-outreach": {
    icon: Users,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
  },
  "support-router": {
    icon: MessageSquare,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  "retention-agent": {
    icon: Target,
    color: "text-pink-400",
    bg: "bg-pink-500/20",
  },
  "send-email": { icon: Mail, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  "strategic-brain": {
    icon: Zap,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
  },
  default: { icon: Activity, color: "text-slate-400", bg: "bg-slate-500/20" },
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds} שניות`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} דקות`;
  return `${Math.floor(seconds / 3600)} שעות`;
};

export default function LiveAgentFeed({ maxItems = 50, compact = false }) {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [isLive, setIsLive] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    // Load initial activities
    loadRecentActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("agent_decisions_live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_decisions",
        },
        (payload) => {
          console.log("🔴 LIVE: New agent decision", payload.new);
          setActivities((prev) => [payload.new, ...prev].slice(0, maxItems));
          setStats((prev) => ({
            total: prev.total + 1,
            success: prev.success + (payload.new.success ? 1 : 0),
            failed: prev.failed + (payload.new.success ? 0 : 1),
          }));

          // Auto-scroll to top for new items
          if (feedRef.current) {
            feedRef.current.scrollTop = 0;
          }
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
        console.log("Realtime subscription:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [maxItems]);

  const loadRecentActivities = async () => {
    const { data, error } = await supabase
      .from("agent_decisions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(maxItems);

    if (!error && data) {
      setActivities(data);
      setStats({
        total: data.length,
        success: data.filter((d) => d.success).length,
        failed: data.filter((d) => !d.success).length,
      });
    }
  };

  const getAgentStyle = (agentId) => {
    return AGENT_ICONS[agentId] || AGENT_ICONS.default;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-xs text-slate-400">
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.total} decisions
          </Badge>
        </div>
        {activities.slice(0, 5).map((activity, index) => {
          const style = getAgentStyle(activity.agent_id);
          const Icon = style.icon;
          return (
            <div
              key={activity.id || index}
              className="flex items-center gap-2 text-xs"
            >
              <Icon className={`w-3 h-3 ${style.color}`} />
              <span className="flex-1 truncate">{activity.decision_type}</span>
              <span className="text-slate-500">
                {formatTimeAgo(activity.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-lg border border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <h2 className="font-bold text-lg">Agent Activity</h2>
            <Badge
              variant="outline"
              className={isLive ? "border-green-500/50 text-green-400" : ""}
            >
              {isLive ? "🔴 LIVE" : "OFFLINE"}
            </Badge>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">✓ {stats.success}</span>
            <span className="text-red-400">✗ {stats.failed}</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {activities.map((activity, index) => {
            const style = getAgentStyle(activity.agent_id);
            const Icon = style.icon;
            const isNew =
              index === 0 &&
              Date.now() - new Date(activity.created_at).getTime() < 5000;

            return (
              <motion.div
                key={activity.id || index}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg border transition-all ${
                  isNew
                    ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-white/5 bg-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Agent Icon */}
                  <div className={`p-2 rounded-lg ${style.bg}`}>
                    <Icon className={`w-5 h-5 ${style.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {activity.agent_id}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          activity.success
                            ? "border-green-500/50 text-green-400"
                            : "border-red-500/50 text-red-400"
                        }
                      >
                        {activity.success ? "Success" : "Failed"}
                      </Badge>
                      {isNew && (
                        <Badge className="bg-green-500 text-white animate-pulse">
                          NEW
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-slate-300 mb-2">
                      <span className="font-mono bg-white/10 px-2 py-0.5 rounded">
                        {activity.decision_type}
                      </span>
                    </div>

                    {/* Action details */}
                    {activity.action && (
                      <div className="text-xs text-slate-400 bg-black/20 rounded p-2 font-mono overflow-x-auto">
                        {typeof activity.action === "string"
                          ? activity.action
                          : JSON.stringify(activity.action, null, 2).substring(
                              0,
                              200,
                            )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(activity.created_at)}</span>
                      <span>({formatTimeAgo(activity.created_at)} ago)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No agent activity yet</p>
            <p className="text-xs">Activities will appear here in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
}
