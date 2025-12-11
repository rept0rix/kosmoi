/**
 * HeatmapService.js
 * Simulates a "Vision Model" analyzing the DOM to predict user attention.
 */
export const HeatmapService = {
    /**
     * Generates a set of heatmap points based on a simulated analysis of the screen.
     * In a real app, this would use an actual Vision Model or eye-tracking data.
     * Here, we use heuristics: Center of screen, typical "F-pattern", and random interest points.
     * 
     * @param {number} width - Width of the container
     * @param {number} height - Height of the container
     * @returns {Array<{x: number, y: number, value: number}>} Array of points
     */
    generateHeatmapData: (width, height) => {
        const points = [];
        const numPoints = 1500; // Total "gaze" points to simulate

        // Helper to add a cluster of points around a center
        const addCluster = (centerX, centerY, spread, intensity, count) => {
            for (let i = 0; i < count; i++) {
                // Gaussian-ish distribution
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * spread;
                // Bias towards center of cluster
                const x = centerX + Math.cos(angle) * radius * Math.random();
                const y = centerY + Math.sin(angle) * radius * Math.random();

                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    points.push({
                        x: Math.floor(x),
                        y: Math.floor(y),
                        value: intensity // Base intensity
                    });
                }
            }
        };

        // 1. Center of Screen (Hero Section bias) - The "Main Attention"
        addCluster(width / 2, height * 0.3, width * 0.25, 1.0, 500);

        // 2. Top-Left (Logo/Nav bias) - F-Pattern start
        addCluster(width * 0.1, height * 0.05, 100, 0.8, 200);

        // 3. Top-Right (CTA/Menu bias)
        addCluster(width * 0.9, height * 0.05, 80, 0.7, 150);

        // 4. "Reading" the content - Horizontal bands
        // Simulated paragraph at 50% height
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * (width * 0.6) + (width * 0.2); // Middle 60%
            const y = (height * 0.5) + (Math.random() * 50); // Band
            points.push({ x, y, value: 0.5 });
        }

        // 5. Random "Interest Points" (Simulated buttons or images)
        const interestPoints = 3;
        for (let k = 0; k < interestPoints; k++) {
            const ix = Math.random() * width;
            const iy = Math.random() * height;
            addCluster(ix, iy, 60, 0.9, 100);
        }

        return points;
    }
};
