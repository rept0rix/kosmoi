
import React, { useEffect, useRef } from 'react';
import { agents } from '@/services/agents/AgentRegistry';

const NeuralCanvas = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        const NODES = agents.length > 0 ? agents.map((agent) => ({
            id: agent.id,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            role: agent.role,
            color: agent.model.includes('pro') ? '#3b82f6' : '#10b981',
            pulse: 0
        })) : Array.from({ length: 15 }).map((_, i) => ({
            id: `node-${i}`,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            role: ['worker', 'manager', 'executive'][Math.floor(Math.random() * 3)],
            color: i % 2 === 0 ? '#3b82f6' : '#10b981',
            pulse: 0
        }));

        const EDGES = [];
        NODES.forEach((node, i) => {
            NODES.forEach((other, j) => {
                if (i < j && Math.random() > 0.7) {
                    EDGES.push({ source: node, target: other, active: false });
                }
            });
        });

        // Resize Logic
        const updateSize = () => {
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;

                // Keep nodes in bounds
                NODES.forEach(node => {
                    if (node.x > canvas.width) node.x = canvas.width - 20;
                    if (node.y > canvas.height) node.y = canvas.height - 20;
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => updateSize());
        if (container) {
            resizeObserver.observe(container);
        }
        updateSize();

        // Particles System
        const PARTICLES = [];
        const spawnParticle = () => {
            if (EDGES.length === 0) return;
            const edge = EDGES[Math.floor(Math.random() * EDGES.length)];
            PARTICLES.push({
                x: edge.source.x,
                y: edge.source.y,
                targetX: edge.target.x,
                targetY: edge.target.y,
                progress: 0,
                speed: 0.02 + Math.random() * 0.03,
                color: '#60a5fa'
            });
        };

        // Animation Loop
        const render = () => {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update Nodes
            NODES.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                if (node.x < 10 || node.x > canvas.width - 10) node.vx *= -1;
                if (node.y < 10 || node.y > canvas.height - 10) node.vy *= -1;
                node.pulse = Math.max(0, node.pulse - 0.05);
            });

            // Draw Edges
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            EDGES.forEach(edge => {
                ctx.beginPath();
                ctx.moveTo(edge.source.x, edge.source.y);
                ctx.lineTo(edge.target.x, edge.target.y);
                ctx.stroke();
            });

            // Particles
            if (Math.random() > 0.9) spawnParticle();
            for (let i = PARTICLES.length - 1; i >= 0; i--) {
                const p = PARTICLES[i];
                p.progress += p.speed;
                const cx = p.x + (p.targetX - p.x) * p.progress;
                const cy = p.y + (p.targetY - p.y) * p.progress;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;

                if (p.progress >= 1) {
                    PARTICLES.splice(i, 1);
                    const targetNode = NODES.find(n => Math.abs(n.x - p.targetX) < 1 && Math.abs(n.y - p.targetY) < 1);
                    if (targetNode) targetNode.pulse = 1;
                }
            }

            // Draw Nodes
            NODES.forEach(node => {
                if (node.pulse > 0) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8 + node.pulse * 10, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${node.pulse})`;
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();
                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px monospace';
                ctx.fillText(node.role, node.x + 12, node.y + 3);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950 rounded-xl">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block"
            />
        </div>
    );
};

export default NeuralCanvas;
