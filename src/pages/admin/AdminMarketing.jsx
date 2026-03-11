import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Megaphone, TrendingUp, Send, RefreshCw } from "lucide-react";
import { AgentRunner } from "@/features/agents/services/AgentRunner";
import { MARKETING_AGENT } from "@/features/agents/services/registry/MarketingAgent";
import { useToast } from "@/components/ui/use-toast";
import { MarketingService } from "../../services/integrations/MarketingService";
import { supabase } from "@/api/supabaseClient";
import KosmoiLoader from "@/components/ui/KosmoiLoader";

const AdminMarketing = () => {
  const [history, setHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [agentOutput, setAgentOutput] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();

    const channel = supabase.channel("admin-marketing-feed");
    /** @type {any} */ (channel).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "marketing_posts" },
      () => loadHistory(),
    );
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await MarketingService.getHistory();
      setHistory(data || []);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDave = async () => {
    setIsThinking(true);
    setAgentOutput(null);

    try {
      const input = "Find a trending travel topic for Koh Samui and generate an Instagram post for it.";
      const result = await AgentRunner.run(MARKETING_AGENT, input, { niche: "Travel & Services" });
      setAgentOutput(result);
    } catch (error) {
      console.error(error);
      toast({ title: "Dave Error", description: "Dave crashed!", variant: "destructive" });
    } finally {
      setIsThinking(false);
    }
  };

  const handlePost = async () => {
    if (!agentOutput || !agentOutput.output) return;

    setIsPosting(true);
    try {
      const imageUrl = await MarketingService.generateImageAsset(
        agentOutput.output.substring(0, 50),
      );
      await MarketingService.publishPost("instagram", {
        caption: agentOutput.output,
        imageUrl,
      });
      toast({ title: "Posted!", description: "Content is live on Instagram." });
      setAgentOutput(null);
      loadHistory();
    } catch (error) {
      console.error(error);
      toast({ title: "Post Failed", description: "Could not publish content.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Marketing Center
          </h1>
          <p className="text-slate-400">Manage your social presence with Dave</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-green-500/10 border-green-500/20 text-green-400 text-sm">
            <Bot className="w-4 h-4" />
            Dave: <span className="font-bold">Online</span>
          </div>
          <Button onClick={loadHistory} variant="outline" size="sm" className="border-white/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white">Daily Actions</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Dave is ready to scrape trends and generate viral content for you.
            </p>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-500 h-12 text-lg"
              onClick={handleRunDave}
              disabled={isThinking}
            >
              {isThinking ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Dave is working...</>
              ) : (
                <><TrendingUp className="w-5 h-5 mr-2" /> Generate Daily Content</>
              )}
            </Button>
          </Card>

          {/* Recent Posts */}
          <Card className="bg-slate-900/40 border-white/5">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recent Posts</h3>
            </div>
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
              ) : (
                history.map((post) => (
                  <div
                    key={post.id}
                    className="flex gap-3 items-start p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className={`p-2 rounded-full ${
                      post.platform === "instagram"
                        ? "bg-pink-500/20 text-pink-400"
                        : "bg-slate-700 text-slate-400"
                    }`}>
                      <Send className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {post.content?.caption?.substring(0, 30)}...
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className="text-xs bg-green-500/20 text-green-400">
                      {post.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Agent Workspace */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-white/5">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white">Dave's Workspace</h3>
            </div>
          </div>

          <div className="p-6 min-h-[500px]">
            {!agentOutput && !isThinking && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-2 py-20">
                <Bot className="w-16 h-16" />
                <p>Waiting for instructions...</p>
              </div>
            )}

            {agentOutput && (
              <div className="space-y-6">
                {/* Thoughts */}
                {agentOutput.thoughtProcess && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-xs uppercase tracking-wider text-slate-500">
                      Thought Stream
                    </h4>
                    <div className="bg-slate-950/50 p-4 rounded-lg text-sm font-mono text-slate-400 space-y-2 border border-white/5 max-h-[200px] overflow-y-auto">
                      {agentOutput.thoughtProcess.map((t, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-purple-400">{">"}</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                <div className="space-y-2">
                  <h4 className="font-medium text-xs uppercase tracking-wider text-slate-500">
                    Suggested Content
                  </h4>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-purple-500/20">
                    <pre className="whitespace-pre-wrap font-sans text-slate-200">
                      {typeof agentOutput.output === "object"
                        ? JSON.stringify(agentOutput.output, null, 2)
                        : agentOutput.output}
                    </pre>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      className="bg-pink-600 hover:bg-pink-500"
                      onClick={handlePost}
                      disabled={isPosting}
                    >
                      {isPosting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Post to Instagram
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminMarketing;
