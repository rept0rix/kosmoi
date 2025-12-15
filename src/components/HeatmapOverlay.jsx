import React, { useRef, useEffect } from 'react';

/**
 * HeatmapOverlay
 * Renders a transparent canvas overlay with a heatmap visualization.
 * Uses the 'simpleheat' library (lightweight).
 * 
 * Note: Since 'simpleheat' is likely not in package.json, I will include a 
 * minimal inline version or fallback to a custom implementation if needed.
 * For robustness, I'll write a custom lightweight drawer here to avoid dependency issues.
 */
const HeatmapOverlay = ({ width, height, data, visible }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !visible || !data.length) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        // 1. Draw "shadow" points (alpha accumulation)
        // Create a temporary canvas for the grayscale gradient Map
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = width;
        shadowCanvas.height = height;
        const shadowCtx = shadowCanvas.getContext('2d');

        data.forEach(p => {
            shadowCtx.beginPath();
            const radius = 25; // Spot size
            // Radial gradient for soft edges
            const grad = shadowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            grad.addColorStop(0, `rgba(0,0,0, ${0.1 * p.value})`); // Inner
            grad.addColorStop(1, 'rgba(0,0,0,0)'); // Outer

            shadowCtx.fillStyle = grad;
            // shadowCtx.globalAlpha = 0.1; // Additive blending handled by gradient alpha
            shadowCtx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
        });

        // 2. Colorization
        // Get the pixel data from the shadow map
        const helperImageData = shadowCtx.getImageData(0, 0, width, height);
        const pixels = helperImageData.data; // [r, g, b, a, ...]

        // Define a gradient map (Blue -> Green -> Yellow -> Red)
        // 256 colors
        const gradientCanvas = document.createElement('canvas');
        gradientCanvas.width = 1;
        gradientCanvas.height = 256;
        const gradCtx = gradientCanvas.getContext('2d');
        const gradient = gradCtx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0.0, 'rgba(0,0,255,0)');    // Transparent Blue (Low)
        gradient.addColorStop(0.1, 'rgba(0,0,255,0.2)');  // Blue
        gradient.addColorStop(0.3, 'rgba(0,255,0,0.5)');  // Green
        gradient.addColorStop(0.6, 'rgba(255,255,0,0.8)'); // Yellow
        gradient.addColorStop(1.0, 'rgba(255,0,0,0.9)');    // Red (High)
        gradCtx.fillStyle = gradient;
        gradCtx.fillRect(0, 0, 1, 256);
        const gradientData = gradCtx.getImageData(0, 0, 1, 256).data;

        // Map alpha of shadow to color from gradient
        const finalImageData = ctx.createImageData(width, height);
        const finalPixels = finalImageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3]; // The accumulated alpha from shadow map

            if (alpha > 0) {
                // Determine color index based on alpha intensity (0-255)
                const colorIndex = alpha * 4; // Simplification

                // Safe lookup
                const r = gradientData[Math.min(colorIndex, 255 * 4)];
                const g = gradientData[Math.min(colorIndex + 1, 255 * 4 + 1)];
                const b = gradientData[Math.min(colorIndex + 2, 255 * 4 + 2)];
                const a = gradientData[Math.min(colorIndex + 3, 255 * 4 + 3)];

                finalPixels[i] = r;
                finalPixels[i + 1] = g;
                finalPixels[i + 2] = b;
                finalPixels[i + 3] = a; // Use gradient's alpha
            }
        }

        ctx.putImageData(finalImageData, 0, 0);

    }, [width, height, data, visible]);

    if (!visible) return null;

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 mix-blend-multiply opacity-80"
            style={{ pointerEvents: 'none' }}
        />
    );
};

export default HeatmapOverlay;
