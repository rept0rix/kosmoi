import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Bot,
  Sparkles,
  Cpu,
  Network,
} from "lucide-react";
import { agents as initialAgents } from "@/features/agents/services/AgentRegistry";

import { useNavigate } from "react-router-dom";
import { BlogAgent } from "@/features/agents/BlogAgent";
import { supabase } from "@/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import LiveAgentFeed from "@/components/admin/LiveAgentFeed";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const colorMap = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    shadow: "shadow-blue-500/20",
  },
  green: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    shadow: "shadow-emerald-500/20",
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    shadow: "shadow-purple-500/20",
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-400",
    shadow: "shadow-red-500/20",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    shadow: "shadow-amber-500/20",
  },
};

export default function AdminAgents() {
  const navigate = useNavigate();
  // Initialize with static agents, but allow local state management
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [newAgent, setNewAgent] = useState({
    name: "",
    role: "",
    description: "",
    color: "blue",
    type: "assistant",
  });

  // Blog Agent State
  const [blogDialogState, setBlogDialogState] = useState({
    isOpen: false,
    topic: "",
    tone: "Inspirational",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const syncWithRegistry = () => {
    // Master Sync: Merges Registry (Single Source of Truth for Code) with LocalStorage (User Overrides)
    const stored = localStorage.getItem("kosmoi_admin_agents_v2");
    const storedAgents = stored ? JSON.parse(stored) : [];
    const storedMap = new Map(storedAgents.map((a) => [a.id, a]));

    // 1. Start with Initial Agents (Codebase)
    const merged = initialAgents.map((systemAgent) => {
      const userOverride = storedMap.get(systemAgent.id);
      if (userOverride) {
        // Merge: Keep system structure but allow user overrides for specific fields
        return {
          ...systemAgent, // Base: System definition
          ...userOverride, // Overlay: User config (e.g. customized instructions)
          // Ensure critical fields aren't completely lost if userOverride is malformed
          name: userOverride.name || systemAgent.name,
          role: userOverride.role || systemAgent.role,
        };
      }
      return systemAgent;
    });

    // 2. Add purely local agents (User created)
    const systemIds = new Set(initialAgents.map((a) => a.id));
    const localOnly = storedAgents.filter((a) => !systemIds.has(a.id));

    const finalAgentList = [...merged, ...localOnly];
    setAgents(finalAgentList);
    saveAgents(finalAgentList);
  };

  useEffect(() => {
    syncWithRegistry();
  }, []);

  const saveAgents = (updatedAgents) => {
    setAgents(updatedAgents);
    localStorage.setItem(
      "kosmoi_admin_agents_v2",
      JSON.stringify(updatedAgents),
    );
  };

  const handleAddAgent = () => {
    const id = newAgent.name.toLowerCase().replace(/\s+/g, "_");
    const agentToAdd = {
      id,
      ...newAgent,
      capabilities: ["chat"], // default
      systemPrompt: `You are ${newAgent.name}, a ${newAgent.role}.`,
    };
    saveAgents([...agents, agentToAdd]);
    setIsAddOpen(false);
    setNewAgent({
      name: "",
      role: "",
      description: "",
      color: "blue",
      type: "assistant",
    });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to decommission this agent?")) {
      saveAgents(agents.filter((a) => a.id !== id));
    }
  };

  const handleGenerateArticle = async () => {
    setIsGenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const agent = new BlogAgent(user);
      toast({
        title: "Agent Activated",
        description: "Samui Storyteller is drafting your article...",
      });

      // Trigger generation
      const response = await agent.generateArticle(
        blogDialogState.topic,
        blogDialogState.tone,
      );

      toast({
        title: "Draft Complete",
        description: "Article saved to drafts. Check the Blog module.",
      });
      console.log("Agent Response:", response);
      setBlogDialogState({ isOpen: false, topic: "", tone: "Inspirational" });
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        variant: "destructive",
        title: "Agent Error",
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredAgents = (agents || [])
    .filter((a) => a && a.name) // Filter out undefined/null agents
    .filter(
      (agent) =>
        (agent.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.role || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            AGENT{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-500">
              COMMAND
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            // NEURAL_WORKFORCE_MATRIX
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={syncWithRegistry}
            title="Resync with Code Registry"
            className="text-slate-400 hover:text-white"
          >
            <Bot className="w-4 h-4 mr-2" /> Resync
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <NeonButton variant="blue" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Deploy Node
              </NeonButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deploy New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newAgent.name}
                    onChange={(e) =>
                      setNewAgent({ ...newAgent, name: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={newAgent.role}
                    onChange={(e) =>
                      setNewAgent({ ...newAgent, role: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color Theme
                  </Label>
                  <Select
                    onValueChange={(v) =>
                      setNewAgent({ ...newAgent, color: v })
                    }
                    defaultValue={newAgent.color}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue (Tech)</SelectItem>
                      <SelectItem value="green">Green (Growth)</SelectItem>
                      <SelectItem value="purple">Purple (Creative)</SelectItem>
                      <SelectItem value="red">Red (Critical)</SelectItem>
                      <SelectItem value="amber">Amber (Support)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="desc" className="text-right pt-2">
                    Directive
                  </Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                    placeholder="Brief description of primary function..."
                    value={newAgent.description}
                    onChange={(e) =>
                      setNewAgent({ ...newAgent, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAgent}>Deploy Unit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Blog Generation Dialog */}
      <Dialog
        open={!!blogDialogState.isOpen}
        onOpenChange={(open) =>
          !open &&
          setBlogDialogState({
            isOpen: false,
            topic: "",
            tone: "Inspirational",
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Draft New Article</DialogTitle>
            <DialogDescription>
              Commission the Samui Storyteller to write a new piece.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Topic / Title</Label>
              <Input
                placeholder="e.g., Top 10 Hidden Beaches"
                value={blogDialogState.topic}
                onChange={(e) =>
                  setBlogDialogState((prev) => ({
                    ...prev,
                    topic: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={blogDialogState.tone}
                onValueChange={(val) =>
                  setBlogDialogState((prev) => ({ ...prev, tone: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inspirational">Inspirational</SelectItem>
                  <SelectItem value="Informative">Informative</SelectItem>
                  <SelectItem value="Adventurous">Adventurous</SelectItem>
                  <SelectItem value="Luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleGenerateArticle}
              disabled={!blogDialogState.topic || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" /> Start Writing
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {filteredAgents.map((agent) => (
          <GlassCard
            key={agent.id}
            className={`p-0 overflow-hidden group hover:scale-[1.02] transition-all`}
          >
            <div
              className={`h-1 w-full ${colorMap[agent.color]?.bg.replace("/10", "/50") || "bg-slate-500"}`}
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`relative w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[agent.color]?.border || "border-slate-800"} ${colorMap[agent.color]?.bg || "bg-slate-900"} ${colorMap[agent.color]?.text} ${colorMap[agent.color]?.shadow} transition-colors`}
                  >
                    <Cpu className="w-6 h-6" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-none mb-1">
                      {agent.name}
                    </h3>
                    <p
                      className={`text-xs font-mono uppercase tracking-wider ${colorMap[agent.color]?.text || "text-slate-500"}`}
                    >
                      {agent.role}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-white"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-slate-950 border-slate-800"
                  >
                    <DropdownMenuLabel className="text-slate-400 font-mono text-xs">
                      OPERATIONS
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => navigate(`/admin/agents/${agent.id}`)}
                      className="text-slate-200 focus:bg-slate-900"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Configure Node
                    </DropdownMenuItem>
                    {agent.id === "agent_blog_writer" && (
                      <DropdownMenuItem
                        onSelect={() =>
                          setBlogDialogState({
                            isOpen: true,
                            topic: "",
                            tone: "Inspirational",
                          })
                        }
                        className="text-purple-400 focus:bg-purple-900/20 focus:text-purple-300"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Draft Article
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-slate-800" />
                    <DropdownMenuItem
                      onSelect={() => handleDelete(agent.id)}
                      className="text-red-500 focus:bg-red-900/20 focus:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Decommission
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-slate-400 mb-4 min-h-[40px] line-clamp-2 leading-relaxed">
                {agent.description || "No directive specified for this unit."}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <Badge
                  variant="outline"
                  className={`font-mono text-[10px] ${colorMap[agent.color]?.border} ${colorMap[agent.color]?.text} bg-transparent`}
                >
                  ID: {agent.id.substring(0, 8)}
                </Badge>
                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                  <Network className="w-3 h-3" /> ONLINE
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Live Conversation Feed */}
      <div className="space-y-4">
        <GlassCard className="p-0 overflow-hidden bg-black/40 border-white/5">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Network className="w-5 h-5 text-neon-cyan" />
            <h2 className="text-lg font-bold tracking-tight text-white">
              Live Neural Network
            </h2>
          </div>
          <div className="p-2">
            <LiveAgentFeed />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
