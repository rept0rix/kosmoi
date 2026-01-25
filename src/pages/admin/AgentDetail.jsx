import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Terminal,
  Code,
  Brain,
  Bot,
  Cpu,
  Zap,
  Activity,
  Grid,
} from "lucide-react";
import { agents as initialAgents } from "@/features/agents/services/AgentRegistry";

const colorMap = {
  blue: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  green: {
    border: "border-green-500/20",
    bg: "bg-green-500/10",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  purple: {
    border: "border-purple-500/20",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  red: {
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  amber: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  pink: {
    border: "border-pink-500/20",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
  },
  cyan: {
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
};

export default function AgentDetail() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    // Load agents from storage or registry
    const stored = localStorage.getItem("kosmoi_admin_agents");
    const allAgents = stored ? JSON.parse(stored) : initialAgents;
    const found = allAgents.find((a) => a.id === agentId);
    if (found) {
      setAgent(found);
    } else {
      console.error("Agent not found:", agentId);
      // navigate('/admin/agents'); // Optional: redirect if not found
    }
  }, [agentId]);

  const handleSave = () => {
    const stored = localStorage.getItem("kosmoi_admin_agents");
    const allAgents = stored ? JSON.parse(stored) : initialAgents;
    const updatedAgents = allAgents.map((a) => (a.id === agent.id ? agent : a));
    localStorage.setItem("kosmoi_admin_agents", JSON.stringify(updatedAgents));
    alert("Agent configuration saved.");
  };

  if (!agent)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neon-cyan">
        <div className="flex flex-col items-center gap-4">
          <Cpu className="w-12 h-12 animate-pulse" />
          <p className="font-mono text-sm tracking-widest">
            INITIALIZING NEURAL LINK...
          </p>
        </div>
      </div>
    );

  const theme = colorMap[agent.color] || colorMap.cyan;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 font-sans text-slate-200">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 ${theme.bg.replace("/10", "/30")}`}
        />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-6 relative z-10">
        <NeonButton
          variant="ghost"
          className="rounded-full w-10 h-10 p-0"
          onClick={() => navigate("/admin/agents")}
        >
          <ArrowLeft className="w-5 h-5" />
        </NeonButton>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight text-white">
            {agent.name}
            <Badge
              variant="outline"
              className={`ml-2 border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1 ${theme.text}`}
            >
              <Zap className="w-3 h-3 mr-1 inline-block" />
              {agent.role}
            </Badge>
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-mono text-xs mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            ID: {agent.id}
            <span className="mx-2 text-slate-700">|</span>
            <span className="opacity-70">v.3.2.0 (Stable)</span>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <NeonButton
            variant="cyan"
            onClick={handleSave}
            className="gap-2 px-6"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </NeonButton>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 relative z-10">
        {/* Left Column: System Prompt & Tools */}
        <div className="col-span-8 space-y-6">
          <GlassCard variant="premium" className="h-[600px] flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-neon-cyan font-bold tracking-wider text-sm uppercase">
                <Terminal className="w-4 h-4" />
                Neural Core Definition
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-black/40 border-white/10 text-slate-400 font-mono"
              >
                prompt_v2.txt
              </Badge>
            </div>
            <div className="flex-1 p-0 relative group">
              <Textarea
                className="w-full h-full resize-none bg-[#0a0f1e] border-0 focus-visible:ring-0 rounded-none p-6 font-mono text-xs leading-relaxed text-green-400/90 selection:bg-green-500/30 font-light"
                value={agent.systemPrompt}
                onChange={(e) =>
                  setAgent({ ...agent, systemPrompt: e.target.value })
                }
                spellCheck="false"
              />
              {/* Editor Glow */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="bg-black/40 p-2 text-[10px] items-center flex gap-4 text-slate-500 font-mono border-t border-white/5">
              <span>Ready for injection</span>
              <span>{agent.systemPrompt?.length || 0} chars</span>
              <span>UTF-8</span>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4 text-purple-400 font-bold tracking-wider text-sm uppercase">
              <Code className="w-4 h-4" />
              Active Function Calls
            </div>
            <div className="flex flex-wrap gap-2">
              {agent.allowedTools?.map((tool, i) => (
                <div key={i} className="group relative">
                  <div className="absolute inset-0 bg-purple-500/20 blur-md rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Badge
                    variant="secondary"
                    className="relative px-3 py-1.5 bg-slate-900/80 border border-purple-500/30 text-purple-300 font-mono text-xs hover:border-purple-400 transition-colors cursor-default"
                  >
                    <Grid className="w-3 h-3 mr-1.5 opacity-70" />
                    {tool}
                  </Badge>
                </div>
              ))}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 text-xs transition-colors">
                <span className="text-lg leading-none">+</span> Add Tool
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Function registry synchronized with backend. Permissions verified.
            </p>
          </GlassCard>
        </div>

        {/* Right Column: Settings */}
        <div className="col-span-4 space-y-6">
          {/* Visual Identity / Avatar */}
          <GlassCard className="p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div
              className={`absolute inset-0 bg-gradient-to-b ${theme.bg} to-transparent opacity-20`}
            />

            <div className="relative group cursor-pointer mb-6">
              <div
                className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl bg-slate-950 border border-white/10 shadow-2xl relative z-10 ${theme.text}`}
              >
                <Bot className="w-16 h-16" />
              </div>
              {/* Holographic Projection Effect */}
              <div
                className={`absolute -inset-4 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 ${theme.bg.replace("bg-", "bg-")}`}
              />
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 shadow-neon-green animate-pulse z-20" />
            </div>

            <div className="w-full space-y-4 relative z-10">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                  Designation Color
                </Label>
                <Select
                  value={agent.color || "blue"}
                  onValueChange={(v) => setAgent({ ...agent, color: v })}
                >
                  <SelectTrigger className="bg-slate-950/50 border-white/10 text-slate-300 h-9">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                    {Object.keys(colorMap).map((color) => (
                      <SelectItem
                        key={color}
                        value={color}
                        className="capitalize hover:bg-white/5 focus:bg-white/5"
                      >
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold tracking-wider text-sm uppercase">
              <Brain className="w-4 h-4" />
              Model Architecture
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                  Provider Engine
                </Label>
                <Select
                  value={agent.model}
                  onValueChange={(v) => setAgent({ ...agent, model: v })}
                >
                  <SelectTrigger className="bg-slate-950/50 border-white/10 text-slate-300 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                    <SelectItem value="gemini-3-pro">
                      Gemini 3.0 Pro (Google)
                    </SelectItem>
                    <SelectItem value="gemini-2.0-flash">
                      Gemini 2.0 Flash (Fast)
                    </SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                    <SelectItem value="claude-3-5-sonnet">
                      Claude 3.5 Sonnet (Anthropic)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                  Context Window (Type)
                </Label>
                <Select
                  value={agent.memory?.type || "shortterm"}
                  onValueChange={(v) =>
                    setAgent({ ...agent, memory: { ...agent.memory, type: v } })
                  }
                >
                  <SelectTrigger className="bg-slate-950/50 border-white/10 text-slate-300 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                    <SelectItem value="shortterm">
                      Disposable (Session RAM)
                    </SelectItem>
                    <SelectItem value="midterm">
                      Rolling Summary (LTM)
                    </SelectItem>
                    <SelectItem value="longterm">
                      Vector Database (RAG)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                    Execution TTL
                  </Label>
                  <span className="text-xs font-mono text-neon-cyan">
                    {agent.maxRuntimeSeconds || 3600}s
                  </span>
                </div>
                <Input
                  type="number"
                  className="bg-slate-950/50 border-white/10 text-slate-300 h-9 font-mono"
                  value={agent.maxRuntimeSeconds || 3600}
                  onChange={(e) =>
                    setAgent({
                      ...agent,
                      maxRuntimeSeconds: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
