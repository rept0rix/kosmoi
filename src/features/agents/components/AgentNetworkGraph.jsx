import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";

const AgentNetworkGraph = ({ agents, activeAgentIds, messages }) => {
    const svgRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);

    // 1. Calculate Nodes (Agents)
    useEffect(() => {
        // Filter only active agents or all agents? Let's show active ones prominently.
        // We'll arrange them in a circle for the "Board Room" feel.
        const activeAgents = agents.filter(a => activeAgentIds.includes(a.id));
        const centerX = 150;
        const centerY = 150;
        const radius = 100;

        const newNodes = activeAgents.map((agent, index) => {
            const angle = (index / activeAgents.length) * 2 * Math.PI;
            return {
                id: agent.id,
                role: agent.role,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                color: agent.layer === 'board' ? '#2563eb' : // blue-600
                    agent.layer === 'strategic' ? '#9333ea' : // purple-600
                        agent.layer === 'executive' ? '#ea580c' : // orange-600
                            '#16a34a' // green-600 (operational)
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
            if (sourceId !== 'HUMAN_USER' && targetId !== 'HUMAN_USER') {
                newLinks.push({ source: sourceId, target: targetId, strength: (i + 1) / recentMessages.length });
            }
        }

        setLinks(newLinks);
    }, [messages]);

    return (
        <Card className="w-full h-[320px] bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-2 left-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Team Dynamics
            </div>

            <svg ref={svgRef} width="300" height="300" viewBox="0 0 300 300" className="w-full h-full">
                {/* Links */}
                {links.map((link, i) => {
                    const sourceNode = nodes.find(n => n.id === link.source);
                    const targetNode = nodes.find(n => n.id === link.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                        <line
                            key={i}
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke="#94a3b8"
                            strokeWidth={link.strength * 3}
                            strokeOpacity={link.strength}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                        {/* Pulse effect for active speaker? We'd need to know who spoke last. */}
                        <circle
                            r="16"
                            fill={node.color}
                            className="transition-all duration-500 ease-in-out shadow-lg"
                        />
                        <circle
                            r="18"
                            fill="none"
                            stroke={node.color}
                            strokeOpacity="0.3"
                            strokeWidth="2"
                        />
                        {/* Icon or Initial */}
                        <text
                            textAnchor="middle"
                            dy=".3em"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                            className="pointer-events-none"
                        >
                            {node.role.substring(0, 2).toUpperCase()}
                        </text>

                        {/* Label */}
                        <text
                            y="28"
                            textAnchor="middle"
                            className="text-[8px] fill-slate-500 font-medium uppercase tracking-tight"
                        >
                            {node.role.replace(/-/g, ' ')}
                        </text>
                    </g>
                ))}
            </svg>
        </Card>
    );
};

export default AgentNetworkGraph;
