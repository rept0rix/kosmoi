import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  Play,
  Pause,
  Zap,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext"; // Access to run ad-hoc tasks if needed
import { OptimizerLoop } from "@/services/loops/OptimizerLoop"; // We will control the loop directly
import { supabase } from "@/api/supabaseClient";

const AdminOptimizer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [insights, setInsights] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync with loop state on mount
  useEffect(() => {
    setIsRunning(OptimizerLoop.isRunning);
    fetchInsights();

    // specific channel for optimizer tasks
    const channel = supabase
      .channel("admin-optimizer-tasks")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_tasks" },
        (payload) => {
          // Check if it's an optimization task before refreshing everything
          if (
            payload.new &&
            payload.new.tags &&
            JSON.stringify(payload.new.tags).includes("optimization")
          ) {
            fetchInsights();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_tasks" },
        (payload) => {
          if (
            payload.new &&
            payload.new.tags &&
            JSON.stringify(payload.new.tags).includes("optimization")
          ) {
            fetchInsights();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInsights = async () => {
    try {
      // Fetch tasks tagged as 'optimization' or 'fix' from agent_tasks
      // We look for tasks where 'tags' (jsonb/array) contains 'optimization'
      // Or simpler: filter where title starts with [Optimization] if tags aren't reliable
      // But AgentService.js sets tags: ['optimization', payload.type]

      const { data, error } = await supabase
        .from("agent_tasks")
        .select("*")
        .contains("tags", ["optimization"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching insights:", error);
        return;
      }

      if (data) {
        // Map to UI model
        const mapped = data.map((task) => {
          // Start with defaults
          let type = "optimization";
          let impact = "Unknown";
          let description = task.description;

          // Parse description if it contains structured text from our service
          // Description format: "Start description...\n\nImpact: High\nSuggested Action: {...}"

          const impactMatch = task.description.match(/Impact: (.*?)(\n|$)/);
          if (impactMatch) impact = impactMatch[1].trim();

          // Clean description for display (remove impact line and below?)
          // For now, just show first 100 chars or full if short

          // Check tags for type
          if (task.tags && task.tags.includes("fix")) type = "fix";

          return {
            id: task.id,
            type,
            title: task.title.replace("[Optimization] ", ""),
            description: description,
            impact,
            status: task.status,
            created_at: task.created_at,
          };
        });
        setInsights(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch insights", e);
    }
  };

  // Start/Stop Loop
  const toggleLoop = async () => {
    setIsProcessing(true);
    try {
      if (isRunning) {
        OptimizerLoop.stop();
        setIsRunning(false);
      } else {
        OptimizerLoop.start();
        setIsRunning(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 text-slate-100 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
            Business Optimizer Agent
          </h1>
          <p className="text-slate-400">
            Autonomous loop that analyzes metrics and proposes improvements.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
            <Activity
              className={`w-4 h-4 ${isRunning ? "text-green-400 animate-pulse" : "text-slate-500"}`}
            />
            <span className="text-sm font-mono">
              {isRunning ? "ACTIVE LOOP" : "IDLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Loop Control</h3>
            <p className="text-sm text-slate-400 mb-4">
              Start or pause the continuous analysis cycle.
            </p>
          </div>
          <Button
            onClick={toggleLoop}
            disabled={isProcessing}
            className={`w-full ${isRunning ? "bg-red-900/50 hover:bg-red-900 text-red-200" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" /> Stop Optimizer
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Start Optimizer
              </>
            )}
          </Button>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <div className="space-y-3 mt-4">
            {insights.length === 0 ? (
              <div className="text-sm text-slate-500 italic">
                No recent optimizations found.
              </div>
            ) : (
              insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className="flex gap-3 items-start p-2 rounded hover:bg-white/5"
                >
                  {insight.type === "fix" ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-1" />
                  ) : (
                    <Zap className="w-4 h-4 text-blue-400 mt-1" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{insight.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(insight.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">Stats</h3>
          <div className="grid grid-cols-2 gap-4 mt-4 text-center">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-400">
                {insights.length}
              </div>
              <div className="text-xs text-slate-400 uppercase">
                Total Insights
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {
                  insights.filter(
                    (i) =>
                      i.status === "completed" || i.status === "implemented",
                  ).length
                }
              </div>
              <div className="text-xs text-slate-400 uppercase">Applied</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Optimization Suggestions
        </h3>

        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/30 transition-colors"
            >
              <div
                className={`mt-1 p-2 rounded-lg ${insight.type === "fix" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}
              >
                {insight.type === "fix" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-slate-200">
                    {insight.title}
                  </h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      insight.status === "pending"
                        ? "bg-gray-800 text-gray-400 border-gray-700"
                        : insight.status === "implemented"
                          ? "bg-green-900/30 text-green-400 border-green-800"
                          : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {insight.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  {insight.description}
                </p>
                <div className="flex gap-4 text-xs font-mono text-slate-500">
                  <span>
                    IMPACT:{" "}
                    <span className="text-slate-300">{insight.impact}</span>
                  </span>
                  <span>ID: {insight.id.slice(0, 8)}...</span>
                </div>
              </div>
              {insight.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                >
                  Review
                </Button>
              )}
            </div>
          ))}
          {insights.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              Waiting for the Agent to generate insights...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOptimizer;
