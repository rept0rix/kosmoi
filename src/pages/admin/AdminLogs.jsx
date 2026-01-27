import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchInitialLogs = async () => {
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setLogs(data);
    };

    fetchInitialLogs();

    // Realtime Subscription
    const channel = supabase.channel("admin-system-logs");

    // @ts-ignore
    /** @type {any} */ (channel).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "logs" },
      (payload) => {
        setLogs((prev) => [payload.new, ...prev].slice(0, 100));
      },
    );

    channel.subscribe();

    return () => {
      // @ts-ignore
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Activity className="w-4 h-4 text-amber-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        System Logs
      </h1>

      <Card className="bg-slate-900 border-white/10 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Live System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full pr-4">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="mt-1">{getIcon(log.level)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${
                          log.level === "error"
                            ? "border-red-500/50 text-red-500"
                            : log.level === "success"
                              ? "border-green-500/50 text-green-500"
                              : "border-slate-500 text-slate-400"
                        }`}
                      >
                        {log.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 font-mono">
                      {log.message}
                    </p>
                    {/* Optional Metadata Debug */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[10px] text-slate-500 mt-1 overflow-hidden">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
