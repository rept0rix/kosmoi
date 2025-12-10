
import React, { useEffect, useRef } from 'react';
import { agents } from '@/services/agents/AgentRegistry';

const NeuralCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        const NODES = agents.map((agent, i) => ({
            id: agent.id,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            role: agent.role,
            color: agent.model.includes('pro') ? '#3b82f6' : '#10b981', // Blue for Pro, Green for Flash
            pulse: 0
        }));

        // Create Connections (Edges)
        const EDGES = [];
        NODES.forEach((node, i) => {
            NODES.forEach((other, j) => {
                if (i < j && Math.random() > 0.7) { // 30% chance of connection
                    EDGES.push({ source: node, target: other, active: false });
                }
            });
        });

        // Resize Handler
        const handleResize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        // Particles System (Data Packets)
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
            ctx.fillStyle = '#020617'; // Slate-950
            ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear screen

            // 1. Update Nodes (Float Physics)
            NODES.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off walls
                if (node.x < 20 || node.x > canvas.width - 20) node.vx *= -1;
                if (node.y < 20 || node.y > canvas.height - 20) node.vy *= -1;

                // Pulse effect
                node.pulse = Math.max(0, node.pulse - 0.05);
            });

            // 2. Draw Edges
            ctx.strokeStyle = '#1e293b'; // Slate-800
            ctx.lineWidth = 1;
            EDGES.forEach(edge => {
                ctx.beginPath();
                ctx.moveTo(edge.source.x, edge.source.y);
                ctx.lineTo(edge.target.x, edge.target.y);
                ctx.stroke();
            });

            // 3. Update & Draw Particles (Data Flow)
            if (Math.random() > 0.9) spawnParticle(); // Randomly spawn data

            for (let i = PARTICLES.length - 1; i >= 0; i--) {
                const p = PARTICLES[i];
                p.progress += p.speed;

                // Linear Interpolation
                const cx = p.x + (p.targetX - p.x) * p.progress;
                const cy = p.y + (p.targetY - p.y) * p.progress;

                // Draw Particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Remove checks
                if (p.progress >= 1) {
                    PARTICLES.splice(i, 1);
                    // "Hit" effect on target node
                    const targetNode = NODES.find(n => Math.abs(n.x - p.targetX) < 1 && Math.abs(n.y - p.targetY) < 1);
                    if (targetNode) targetNode.pulse = 1;
                }
            }

            // 4. Draw Nodes
            NODES.forEach(node => {
                // Outer Glow ring (Pulse)
                if (node.pulse > 0) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8 + node.pulse * 10, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${node.pulse})`;
                    ctx.stroke();
                }

                // Node Body
                ctx.beginPath();
                ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();

                // Label
                ctx.fillStyle = '#94a3b8'; // Slate-400
                ctx.font = '10px monospace';
                ctx.fillText(node.role, node.x + 12, node.y + 3);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl bg-slate-950 border border-slate-900 shadow-inner block"
        />
    );
};

export default NeuralCanvas;
