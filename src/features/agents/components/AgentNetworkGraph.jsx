import React, { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

const AgentNetworkGraph = ({ agents, activeAgentIds, messages }) => {
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  // 1. Calculate Nodes (Agents)
  useEffect(() => {
    // Filter only active agents or all agents? Let's show active ones prominently.
    // We'll arrange them in a circle for the "Board Room" feel.
    const activeAgents = agents.filter((a) => activeAgentIds.includes(a.id));
    const centerX = 150;
    const centerY = 150;
    const radius = 100;

    const newNodes = activeAgents.map((agent, index) => {
      const angle = (index / activeAgents.length) * 2 * Math.PI;
      // Determine neon color based on layer/role
      const color =
        agent.layer === "board"
          ? "#00f3ff" // cyan
          : agent.layer === "strategic"
            ? "#d946ef" // pink
            : agent.layer === "executive"
              ? "#f59e0b" // orange (amber)
              : "#22c55e"; // green

      return {
        id: agent.id,
        role: agent.role,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        color: color,
      };
    });

    setNodes(newNodes);
  }, [agents, activeAgentIds]);

  // 2. Calculate Links (Interactions)
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // Look at the last N messages to draw "active" lines
    const recentMessages = messages.slice(-10);
    const newLinks = [];

    for (let i = 0; i < recentMessages.length - 1; i++) {
      const sourceId = recentMessages[i].agent_id;
      const targetId = recentMessages[i + 1].agent_id;

      // Skip user for now, or map user to a central node?
      // Let's focus on agent-to-agent flow.
      if (sourceId !== "HUMAN_USER" && targetId !== "HUMAN_USER") {
        newLinks.push({
          source: sourceId,
          target: targetId,
          strength: (i + 1) / recentMessages.length,
        });
      }
    }

    setLinks(newLinks);
  }, [messages]);

  return (
    <GlassCard className="w-full h-[320px] shadow-lg flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900/50">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      <div className="absolute top-2 left-3 flex items-center gap-2 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
        <div className="text-[10px] font-bold text-neon-cyan/70 uppercase tracking-widest font-mono">
          Neural Mesh
        </div>
      </div>

      <svg
        ref={svgRef}
        width="300"
        height="300"
        viewBox="0 0 300 300"
        className="w-full h-full z-10"
      >
        {/* Links */}
        {links.map((link, i) => {
          const sourceNode = nodes.find((n) => n.id === link.source);
          const targetNode = nodes.find((n) => n.id === link.target);
          if (!sourceNode || !targetNode) return null;

          return (
            <line
              key={i}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="url(#gradientLink)"
              strokeWidth={link.strength * 2}
              strokeOpacity={link.strength}
              strokeLinecap="round"
              className="drop-shadow-neon"
            />
          );
        })}

        {/* Definitions for Gradients */}
        <defs>
          <linearGradient id="gradientLink" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d946ef" stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x},${node.y})`}>
            {/* Outer Glow Ring */}
            <circle
              r="18"
              fill="none"
              stroke={node.color}
              strokeOpacity="0.2"
              strokeWidth="1"
              className="animate-pulse-slow"
            />
            <circle
              r="22"
              fill="none"
              stroke={node.color}
              strokeOpacity="0.1"
              strokeWidth="1"
              strokeDasharray="2,2"
              className="animate-spin-slow origin-center"
            />

            {/* Core Node */}
            <circle
              r="14"
              fill="#0f172a" // Slate-900
              stroke={node.color}
              strokeWidth="2"
              className="transition-all duration-500 ease-in-out shadow-[0_0_15px_rgba(0,243,255,0.3)]"
            />

            {/* Icon or Initial */}
            <text
              textAnchor="middle"
              dy=".3em"
              fill={node.color}
              fontSize="9"
              fontWeight="bold"
              className="pointer-events-none font-mono filter drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
            >
              {node.role.substring(0, 2).toUpperCase()}
            </text>

            {/* Label */}
            <text
              y="32"
              textAnchor="middle"
              fill={node.color}
              className="text-[7px] font-mono uppercase tracking-tight opacity-80"
              style={{ textShadow: `0 0 5px ${node.color}60` }}
            >
              {node.role.replace(/-/g, " ")}
            </text>
          </g>
        ))}
      </svg>
    </GlassCard>
  );
};

export default AgentNetworkGraph;
