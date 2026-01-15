import { BoardOrchestrator } from '../features/agents/services/BoardOrchestrator.js';
import { agents } from '../features/agents/services/AgentRegistry.js';

/**
 * CompanyHeartbeat
 * 
 * The "Engine" of the autonomous company.
 * It ticks every few seconds to check if work needs to be done.
 */
export class CompanyHeartbeat {
    constructor(config = {}) {
        this.intervalMs = config.intervalMs || 10000; // Default 10 seconds
        this.isRunning = false;
        this.timer = null;
        this.orchestrator = new BoardOrchestrator(agents);
        this.onTick = config.onTick || (() => { });
        this.onError = config.onError || console.error;
    }

    start() {
        if (this.isRunning) return;

        console.log("❤️ Company Heartbeat STARTED");
        this.isRunning = true;

        // Initial tick immediately
        this.tick();

        this.timer = setInterval(() => {
            this.tick();
        }, this.intervalMs);
    }

    stop() {
        if (!this.isRunning) return;

        console.log("💔 Company Heartbeat STOPPED");
        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async tick() {
        if (!this.isRunning) return;

        try {
            console.log("💓 Tick...");

            // 1. Get current state (mocked for now, or passed in)
            // In a real app, we might fetch this from Supabase or a global store
            // For now, we rely on the Orchestrator to decide based on its internal logic or passed context

            // 2. Ask Orchestrator what to do
            const decision = await this.orchestrator.tick();

            // 3. Execute decision (or callback to UI to execute)
            if (decision) {
                this.onTick(decision);
            }

        } catch (error) {
            console.error("Heartbeat Error:", error);
            this.onError(error);
        }
    }
}
