
import React, { useEffect, useRef } from 'react';
import { agents } from '@/services/agents/AgentRegistry';

const NeuralCanvas = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // 3D Engine Constants
        const SPHERE_RADIUS = 200;
        const PERSPECTIVE = 800;
        const ROTATION_SPEED = 0.002;

        // 1. Initialize Points (Agents mapped to Sphere Surface)
        let points = agents.length > 0 ? agents.map((agent, i) => {
            // Distribute points using Golden Angle for even sphere coverage (Fibonacci Sphere)
            const phi = Math.acos(1 - 2 * (i + 0.5) / agents.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

            return {
                id: agent.id,
                x: SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta),
                y: SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta),
                z: SPHERE_RADIUS * Math.cos(phi),
                role: agent.role,
                layer: agent.layer,
                color: agent.layer === 'board' ? '#3b82f6' :
                    agent.layer === 'strategic' ? '#a855f7' :
                        agent.layer === 'executive' ? '#f97316' : '#10b981'
            };
        }) : [];

        // Resize Logic
        const updateSize = () => {
            if (container && canvas) {
                // Handle high-DPI displays
                const dpr = window.devicePixelRatio || 1;
                canvas.width = container.clientWidth * dpr;
                canvas.height = container.clientHeight * dpr;
                ctx.scale(dpr, dpr);
                canvas.style.width = `${container.clientWidth}px`;
                canvas.style.height = `${container.clientHeight}px`;
            }
        };

        const resizeObserver = new ResizeObserver(() => updateSize());
        if (container) resizeObserver.observe(container);
        updateSize();

        let angleX = 0;
        let angleY = 0;

        // Render Loop
        const render = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            const cx = width / 2;
            const cy = height / 2;

            // Clear Background
            ctx.clearRect(0, 0, width, height);

            // Auto Rotation
            angleY += ROTATION_SPEED;
            angleX += ROTATION_SPEED * 0.5;

            // Mouse Interaction Logic (optional tilt)
            const targetAngleY = (mouseRef.current.x - cx) * 0.0001;
            const targetAngleX = (mouseRef.current.y - cy) * 0.0001;
            angleY += targetAngleY;
            angleX += targetAngleX;

            // Project and Sort Points
            const projectedPoints = points.map(p => {
                // Rotate X
                let y = p.y * Math.cos(angleX) - p.z * Math.sin(angleX);
                let z = p.y * Math.sin(angleX) + p.z * Math.cos(angleX);
                let x = p.x;

                // Rotate Y
                let tempX = x * Math.cos(angleY) - z * Math.sin(angleY);
                z = x * Math.sin(angleY) + z * Math.cos(angleY);
                x = tempX;

                // Project 3D -> 2D
                const scale = PERSPECTIVE / (PERSPECTIVE + z);
                const x2d = x * scale + cx;
                const y2d = y * scale + cy;

                return { ...p, x2d, y2d, scale, z };
            });

            // Draw Connections (Between close neighbors on sphere)
            ctx.lineWidth = 1;
            projectedPoints.forEach((p1, i) => {
                projectedPoints.slice(i + 1).forEach(p2 => {
                    // Calculate true 3D distance
                    const dist = Math.sqrt(
                        Math.pow(p1.x - p2.x, 2) +
                        Math.pow(p1.y - p2.y, 2) +
                        Math.pow(p1.z - p2.z, 2)
                    );

                    // Connect if close enough
                    if (dist < 100) {
                        const alpha = (1 - dist / 100) * 0.5 * Math.min(p1.scale, p2.scale);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x2d, p1.y2d);
                        ctx.lineTo(p2.x2d, p2.y2d);
                        ctx.stroke();
                    }
                });
            });

            // Draw Nodes (Sorted by Z for depth)
            projectedPoints.sort((a, b) => b.z - a.z).forEach(p => {
                const alpha = p.scale; // Fade out back nodes

                // Glow
                const glowSize = 10 * p.scale;
                const gradient = ctx.createRadialGradient(p.x2d, p.y2d, 0, p.x2d, p.y2d, glowSize);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Core Dot
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, 2 * p.scale, 0, Math.PI * 2);
                ctx.fill();

                // Text Label (only for front nodes)
                if (p.z > -50) {
                    ctx.font = `${10 * p.scale}px monospace`;
                    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`; // slate-300
                    ctx.textAlign = 'center';
                    ctx.fillText(p.role, p.x2d, p.y2d + 15 * p.scale);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        // Mouse Move Handler
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };
        container.addEventListener('mousemove', handleMouseMove);

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            container.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950 rounded-xl cursor-move">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default NeuralCanvas;
