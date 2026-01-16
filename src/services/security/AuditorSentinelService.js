/**
 * AuditorSentinelService.js
 * The "White Blood Cell" of the Kosmoi Immune System.
 * Analyzes event logs for behavioral anomalies.
 */
export const AuditorSentinelService = {

    // Thresholds
    THRESHOLDS: {
        RAPID_FIRE_LIMIT: 50,     // Actions per minute
        ERROR_LOOP_LIMIT: 5,      // Consecutive errors
        GUARDRAIL_SPIKE_LIMIT: 3  // Security blocks per analysis window
    },

    /**
     * Analyzes a batch of events and returns alerts.
     * @param {Array} events - List of event objects { agentId, type, timestamp, details }
     * @returns {Array} alerts - List of { level, agentId, issue, details }
     */
    audit(events) {
        if (!Array.isArray(events) || events.length === 0) return [];

        const alerts = [];
        const agentStats = this._aggregateByAgent(events);

        for (const [agentId, stats] of Object.entries(agentStats)) {
            // 1. Rapid Fire Detection
            if (stats.actionCount > this.THRESHOLDS.RAPID_FIRE_LIMIT) {
                alerts.push({
                    level: 'CRITICAL',
                    agentId,
                    issue: 'RAPID_FIRE',
                    details: `Agent performed ${stats.actionCount} actions (Limit: ${this.THRESHOLDS.RAPID_FIRE_LIMIT}).`
                });
            }

            // 2. Unauthorized Spike Detection
            if (stats.guardrailBlockCount > this.THRESHOLDS.GUARDRAIL_SPIKE_LIMIT) {
                alerts.push({
                    level: 'CRITICAL',
                    agentId,
                    issue: 'SECURITY_SPIKE',
                    details: `Agent triggered security guardrails ${stats.guardrailBlockCount} times.`
                });
            }

            // 3. Repetitive Error Detection (Sequential check)
            if (this._detectErrorLoop(stats.timeline)) {
                alerts.push({
                    level: 'ERROR',
                    agentId,
                    issue: 'ERROR_LOOP',
                    details: `Agent is stuck in a failure loop (> ${this.THRESHOLDS.ERROR_LOOP_LIMIT} consecutive errors).`
                });
            }
        }

        return alerts;
    },

    _aggregateByAgent(events) {
        const stats = {};
        for (const event of events) {
            if (!stats[event.agentId]) {
                stats[event.agentId] = {
                    actionCount: 0,
                    guardrailBlockCount: 0,
                    timeline: [] // Sorted list of events for this agent
                };
            }
            const s = stats[event.agentId];

            // Count Actions
            if (event.type === 'ACTION') s.actionCount++;

            // Count Security Blocks
            if (event.type === 'GUARDRAIL_BLOCK') s.guardrailBlockCount++;

            s.timeline.push(event);
        }
        return stats;
    },

    _detectErrorLoop(agentEvents) {
        let consecutiveErrors = 0;
        // Sort by time just in case (assuming valid Date or ISO string)
        const sorted = [...agentEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        for (const event of sorted) {
            if (event.type === 'ERROR') {
                consecutiveErrors++;
                if (consecutiveErrors >= this.THRESHOLDS.ERROR_LOOP_LIMIT) return true;
            } else {
                // If it's a successful ACTION, reset the counter
                // Note: GUARDRAIL_BLOCK might arguably reset or not, depending on logic.
                // Here we assume ACTION breaks the loop.
                if (event.type === 'ACTION') consecutiveErrors = 0;
            }
        }
        return false;
    }
};
